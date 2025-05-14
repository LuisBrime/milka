import { Context } from 'jsr:@oak/oak'
import { Status } from 'jsr:@oak/commons/status'
import * as path from 'jsr:@std/path'
import {
  type Compiler,
  type Entry,
  rspack,
  type Watching,
} from 'npm:@rspack/core'

import { type ProjectConfiguration, setProjectConfig } from './config/index.ts'
import { P5InjectPlugin, WSScriptPlugin } from './plugins.ts'

interface ProjectCompiler {
  compiler?: Compiler
  watching?: Watching
  config: ProjectConfiguration
  outputPath?: string
}

interface CompileOptions {
  ctx: Context
  project: string
  onWatch?: () => void
}

export class MilkaCompiler {
  projectsMap: Map<string, ProjectCompiler>

  static staticDir = Deno.env.get('STATIC_PATH') ??
    path.resolve(Deno.cwd(), 'static')

  constructor() {
    this.projectsMap = new Map<string, ProjectCompiler>()
  }

  async setupProject(project: string): Promise<boolean> {
    const config = await setProjectConfig(project)
    if (config) {
      this.projectsMap.set(project, { config })
    }

    return Boolean(config)
  }

  getOutputPath(project: string) {
    const compiler = this.projectsMap.get(project)
    return compiler?.outputPath
  }

  async closeAll() {
    for (const project of this.projectsMap.keys()) {
      await this.close(project)
    }
  }

  async close(project: string) {
    const p = this.projectsMap.get(project)
    if (!p) return

    const { compiler, watching, outputPath } = p
    watching?.close()
    compiler?.close((_) => {})

    if (outputPath) await Deno.remove(outputPath, { recursive: true })
  }

  async compile({ ctx, project, onWatch }: CompileOptions) {
    const { config } = this.projectsMap.get(project)!
    const tempOutputDir = await Deno.makeTempDir({
      dir: Deno.cwd(),
      prefix: `__milka_${project}__`,
    })

    const configEntries = await config.getCompilationEntries()
    const plugins = [
      new rspack.HtmlRspackPlugin({
        filename: 'index.html',
        title: project,
        template: path.join(MilkaCompiler.staticDir, 'base_canvas.html'),
        publicPath: `/${project}`,
        scriptLoading: 'blocking',
      }),
      WSScriptPlugin,
      P5InjectPlugin(
        project,
        config.config.outputName,
        config.compilationEntry,
      ),
    ]

    const bundledEntries = configEntries as Entry
    const compiler = rspack({
      plugins,
      mode: 'development',
      name: `milka-build-${project}`,
      entry: bundledEntries,
      output: {
        path: tempOutputDir,
        filename: `[name].js`,
        clean: true,
      },
    })

    const watching = await new Promise<Watching>((resolve) => {
      const w = compiler.watch(
        { ignored: [MilkaCompiler.staticDir] },
        (err, stats) => {
          if (err || stats?.hasErrors()) {
            ctx.throw(
              Status.InternalServerError,
              `Error when compiling ${project}`,
            )
          }

          onWatch?.()
          endHandler(resolve)
        },
      )

      const endHandler = (resolver: (value: Watching) => void) => {
        resolver(w)
      }
    })

    const projectC = { compiler, watching, outputPath: tempOutputDir }
    this.projectsMap.set(project, { config, ...projectC })

    return this.projectsMap.get(project)!
  }
}

export const milkaCompiler = new MilkaCompiler()
