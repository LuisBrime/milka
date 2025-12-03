import { Router, Status } from '@oak/oak';

import { chalk, milkaLog } from '@/log';
import { errorHandler } from '@/router/middleware';
import { SketchRequest } from '@/router/requests';
import { addWSClient, reloadWSClient } from '@/router/web-socket';
import { MilkaCompiler } from '@/services/compiler';
import { SketchFs } from '@/services/fs';
import { serviceRegistry } from '@/services/service-registry';

export const sketchRouter = new Router();

sketchRouter.get('/:sketch+', async (ctx, next) => {
  const sketchPath = ctx.params.sketch;
  if (!sketchPath) {
    ctx.throw(Status.NotFound, 'Project param not sent');
    return next;
  }

  // Check if request resvoles to existing sketch
  const sketchFs = serviceRegistry.get<SketchFs>('fs');
  const request = new SketchRequest(sketchPath, sketchFs);
  if (!request.isResolvedPath) {
    ctx.throw(Status.NotFound, 'Sketch not found');
    return next;
  }

  // Respond to WebSocket request
  const sketchName = request.sketchName;
  if (ctx.request.headers.get('upgrade') === 'websocket') {
    const ws = addWSClient(ctx, sketchName);
    milkaLog(`– 🧵 establishing hot reload...`);

    ws.addEventListener('open', (_) => {
      if (ws.readyState === ws.OPEN) ws.send('woof');
    });
    return next;
  }

  // Respond to compiled sketch with assets
  const milkaCompiler = serviceRegistry.get<MilkaCompiler>('compiler');
  const existingPath = milkaCompiler.getOutputPath(sketchName);
  if (existingPath) {
    if (request.isFileRequest) {
      milkaLog(
        `– 🦴 retrieving asset ${
          chalk.italic.yellow.dim(request.requestPath)
        } for ${chalk.bold.yellow(sketchName)}...`,
      );

      await ctx.send({
        root: existingPath,
        path: './',
        index: request.relativeFileRequestPath,
      });
      return next;
    }

    await ctx.send({
      root: existingPath,
      path: './',
      index: 'index.html',
    });
    milkaLog(`– 🦴 retrieved and served ${sketchName}`);

    return next;
  }

  if (request.isFileRequest) {
    ctx.throw(Status.BadRequest, 'Cannot serve asset to uncompiled sketch');
    return next;
  }

  // Compile sketch and return created HTML
  milkaLog(`– 💡 fetching and rendering ${chalk.bold.yellow(sketchName)}...`);
  if (!(await milkaCompiler.setupSketch(request.requestPath))) {
    ctx.throw(Status.NotFound, 'Sketch could not be configured', {
      sketchName,
    });
    return next;
  }

  const onBuildTrigger = () => reloadWSClient(sketchName);
  const { outputPath } = await milkaCompiler.compile({
    ctx,
    sketch: sketchName,
    onWatch: onBuildTrigger,
  });

  await ctx.send({
    root: outputPath!,
    path: './',
    index: 'index.html',
  });
  milkaLog(
    `– ⚙️  served and stored on ${
      chalk.italic.dim(outputPath!.replace(Deno.cwd(), ''))
    }`,
  );

  return next;
});

sketchRouter.use(errorHandler.middleware);
