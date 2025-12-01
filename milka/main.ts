import { Application } from 'jsr:@oak/oak';

import { chalk, milkaLog } from '@/log';
import { sketchRouter } from '@/router';
import { errorHandler } from '@/router/middleware';
import { MilkaCompiler } from '@/services/compiler';
import { SketchFs } from '@/services/fs';
import { serviceRegistry } from '@/services/service-registry';

const SERVER_PORT = parseInt(Deno.env.get('PORT') ?? '8000');

function setupApplication(app: Application) {
  app.use(sketchRouter.routes());
  app.use(sketchRouter.allowedMethods());

  app.addEventListener('listen', ({ port }) => {
    console.group();
    milkaLog(`will run on port: ${chalk.italic.bold(`${port}`)}`);
    milkaLog('listening...\n');
    console.groupEnd();
  });
  app.addEventListener('error', errorHandler.listener);
}

function setupClosingSignals(controller: AbortController) {
  const signalHandler = async (): Promise<void> => {
    Deno.removeSignalListener('SIGINT', signalHandler);

    console.log('\n');
    milkaLog(chalk.underline('🤍 closing server, bye bye! 👋'));
    console.log('\n');

    const milkaCompiler = serviceRegistry.get<MilkaCompiler>('compiler');
    await milkaCompiler.close();

    controller.abort();
    Deno.exit(0);
  };

  Deno.addSignalListener('SIGINT', signalHandler);
}

/**
 * Initializes Services used accross `milka`, solving dependencies between them.
 */
async function setupServices() {
  const fs = new SketchFs();
  await fs.buildFsTree();

  const compiler = new MilkaCompiler(fs);

  serviceRegistry.register('fs', fs);
  serviceRegistry.register('compiler', compiler);
}

console.log('\n');
console.log(
  chalk.underline(
    `🐶 welcome to ${chalk.hex('#ec4899').bold('milka')},`,
    'your creative coding companion!\n',
  ),
);

const app = new Application();
setupApplication(app);

const closingController = new AbortController();
setupClosingSignals(closingController);

await setupServices();

await app.listen({
  port: SERVER_PORT,
  secure: false,
  signal: closingController.signal,
});
