import { Router } from 'jsr:@oak/oak'
import { Status } from 'jsr:@oak/commons/status'

import { milkaCompiler } from '@/compiler/index.ts'
import { chalk, milkaLog } from '@/log'
import { addWSClient, reloadWSClient } from '@/ws'

export const projectRouter = new Router()
projectRouter.get('/:projectName', async (ctx, next) => {
  const project = ctx.params.projectName
  if (!project) {
    ctx.throw(Status.NotFound, 'Project param not sent')
    return
  }

  if (ctx.request.headers.get('upgrade') === 'websocket') {
    const ws = addWSClient(ctx, project)
    milkaLog(`– 🧵 establishing hot reload...`)

    ws.addEventListener('open', (_) => {
      if (ws.readyState === ws.OPEN) ws.send('woof')
    })
    return next
  }

  const existingPath = milkaCompiler.getOutputPath(project)
  if (existingPath) {
    await ctx.send({
      root: existingPath,
      path: './',
      index: 'index.html',
    })
    milkaLog(`– 🦴 retrieved and served ${project}`)

    return next
  }

  milkaLog(`– 💡 fetching and rendering ${chalk.bold.yellow(project)}...`)
  const configCreated = await milkaCompiler.setupProject(project)
  if (!configCreated) {
    ctx.throw(Status.NotFound, 'Project not found', { project })
    return
  }

  const onBuildTrigger = () => reloadWSClient(project)
  const { outputPath } = await milkaCompiler.compile({
    ctx,
    project,
    onWatch: onBuildTrigger,
  })

  await ctx.send({
    root: outputPath!,
    path: './',
    index: 'index.html',
  })
  milkaLog(
    `– ⚙️  served and stored on ${
      chalk.italic.dim(outputPath!.replace(Deno.cwd(), ''))
    }`,
  )

  return next
})

projectRouter.get('/:projectName/:path', async (ctx, next) => {
  const project = ctx.params.projectName
  const path = ctx.params.path
  if (!project || !path) {
    ctx.throw(Status.NotFound, 'Project param not sent')
    return
  }

  const outputPath = milkaCompiler.getOutputPath(project)
  if (!outputPath) {
    ctx.throw(Status.NotFound, 'Project not found')
    return
  }
  milkaLog(
    `– 🦴 retrieving asset ${chalk.italic.yellow.dim(ctx.params.path)} for ${
      chalk.bold.yellow(project)
    }...`,
  )

  await ctx.send({ root: outputPath, path: './', index: path })
  return next
})
