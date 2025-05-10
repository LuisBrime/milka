import { Router } from 'jsr:@oak/oak'
import { Status } from 'jsr:@oak/commons/status'
import * as path from 'jsr:@std/path'
import { exists } from 'jsr:@std/fs/exists'

import { buildAndWatch, getCompiler } from './compiler.ts'
import { milkaLog } from './log.ts'
import { addWSClient, reloadWSClient } from './ws.ts'

const projectsDir = path.resolve(import.meta.dirname!, 'projects')

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

  const projectCompiler = getCompiler(project)
  if (projectCompiler) {
    await ctx.send({
      root: projectCompiler.outputPath,
      path: './',
      index: 'index.html',
    })
    milkaLog(`– ⚙️  served and stored on ${projectCompiler.outputPath}`)

    return next
  }

  milkaLog(`– 💡 fetching and rendering ${project}...`)
  const projectSourcePath = path.join(projectsDir, `${project}.js`)
  if (!(await exists(projectSourcePath))) {
    ctx.throw(Status.NotFound, 'Project not found', { project })
    return
  }

  const onBuildTrigger = () => reloadWSClient(project)
  const { outputPath } = await buildAndWatch({
    ctx,
    project,
    projectPath: projectSourcePath,
    onWatch: onBuildTrigger,
  })

  await ctx.send({
    root: outputPath,
    path: './',
    index: 'index.html',
  })
  milkaLog(`– ⚙️  served and stored on ${outputPath}`)

  return next
})

projectRouter.get('/:projectName/:path', async (ctx, next) => {
  const project = ctx.params.projectName
  const path = ctx.params.path
  if (!project || !path) {
    ctx.throw(Status.NotFound, 'Project param not sent')
    return
  }

  const { outputPath } = getCompiler(project)
  if (!outputPath) {
    ctx.throw(Status.NotFound, 'Project not found')
    return
  }
  milkaLog(`– 🦴 retrieving asset ${ctx.params.path} for ${project}...`)

  await ctx.send({ root: outputPath, path: './', index: path })
  return next
})
