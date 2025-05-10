import { Context } from 'jsr:@oak/oak'
import { Status } from 'jsr:@oak/commons/status'
import * as path from 'jsr:@std/path'
import { type Compiler, rspack, type Watching } from 'npm:@rspack/core'

import { P5InjectPlugin } from './draw-lib.ts'
import { WSScriptPlugin } from './ws.ts'

interface ProjectCompiler {
  compiler: Compiler
  watching: Watching
  outputPath: string
}

interface CompileOptions {
  ctx: Context
  project: string
  projectPath: string
  onWatch?: () => void
}

const projectCompiler = new Map<string, ProjectCompiler>()
const staticDir = path.resolve(import.meta.dirname!, 'static')

export const getCompiler = (project: string) => {
  return projectCompiler.get(project)!
}

export const closeAll = async () => {
  for (const { compiler, watching, outputPath } of projectCompiler.values()) {
    watching.close()
    compiler.close((_) => {})
    await Deno.remove(outputPath, { recursive: true })
  }
}

const closeCompiler = (
  project: string,
  closeCallback: (error?: Error | null | undefined) => null = (_) => null,
) => {
  if (projectCompiler.has(project)) {
    const { compiler } = projectCompiler.get(project)!
    compiler.close(closeCallback)
  }
}

export const buildAndWatch = async ({
  ctx,
  project,
  projectPath,
  onWatch,
}: CompileOptions) => {
  const tempOutputDir = await Deno.makeTempDir({
    dir: Deno.cwd(),
    prefix: `__milka_${project}__`,
  })

  const compiler = rspack({
    mode: 'development',
    name: `milka-build-${project}`,
    entry: {
      sketch: projectPath,
    },
    output: {
      path: tempOutputDir,
      library: {
        name: 'sketch',
        type: 'var',
        export: 'default',
      },
      filename: 'sketch.js',
      clean: true,
      globalObject: 'globalThis',
    },
    plugins: [
      new rspack.HtmlRspackPlugin({
        filename: 'index.html',
        title: project,
        template: path.join(staticDir, 'base_canvas.html'),
        publicPath: `/${project}`,
        chunks: ['sketch'],
        scriptLoading: 'blocking',
      }),
      WSScriptPlugin,
      P5InjectPlugin,
    ],
  })

  const watching = await new Promise<Watching>((resolve) => {
    const w = compiler.watch({ ignored: [staticDir] }, (err, stats) => {
      if (err || stats?.hasErrors()) {
        ctx.throw(
          Status.InternalServerError,
          `Error when compiling ${project}`,
        )
      }

      onWatch?.()
      endHandler(resolve)
    })

    const endHandler = (resolver: (value: Watching) => void) => {
      resolver(w)
    }
  })

  const projectV = { compiler, watching, outputPath: tempOutputDir }
  projectCompiler.set(project, projectV)

  return {
    ...projectV,
    closeWatch: () => {
      if (projectCompiler.has(project)) {
        const { watching } = projectCompiler.get(project)!
        watching.close()
      }
    },
    closeCompiler: async () => {
      closeCompiler(project)
      if (projectCompiler.has(project)) {
        const { outputPath } = projectCompiler.get(project)!
        projectCompiler.delete(project)
        await Deno.remove(outputPath, { recursive: true })
      }
    },
  }
}
