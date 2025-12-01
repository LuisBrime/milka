import { Context } from 'jsr:@oak/oak';
import { Status } from 'jsr:@oak/commons/status';
import * as path from 'jsr:@std/path';
import {
  type Compiler,
  type Entry,
  rspack,
  type Watching,
} from 'npm:@rspack/core';

import { setSketchConfig, type SketchConfiguration } from '@/compiler/config';
import { type SketchFs } from '@/sketch_fs';
import { Service } from '@/services/service-registry';

import { P5InjectPlugin, WSScriptPlugin } from './plugins.ts';

interface SketchCompiler {
  compiler?: Compiler;
  watching?: Watching;
  config: SketchConfiguration;
  outputPath?: string;
}

interface CompileOptions {
  ctx: Context;
  sketch: string;
  onWatch?: () => void;
}

export class MilkaCompiler extends Service {
  sketchesMap: Map<string, SketchCompiler>;
  sketchFsService: SketchFs;

  static staticDir = Deno.env.get('STATIC_PATH') ??
    path.resolve(Deno.cwd(), 'static');

  constructor(sketchFsService: SketchFs) {
    super();

    this.sketchesMap = new Map<string, SketchCompiler>();
    this.sketchFsService = sketchFsService;
  }

  async setupSketch(requestPath: string): Promise<boolean> {
    const resolved = this.sketchFsService.resolveSketchRequest(requestPath);
    if (!resolved) return false;

    const config = await setSketchConfig(resolved);
    if (config) {
      this.sketchesMap.set(resolved.sketchName, { config });
    }

    return Boolean(config);
  }

  getOutputPath(sketch: string) {
    const compiler = this.sketchesMap.get(sketch);
    return compiler?.outputPath;
  }

  async close(): Promise<void> {
    for (const sketch of this.sketchesMap.keys()) {
      await this.closeSketch(sketch);
    }
  }

  async closeSketch(sketch: string): Promise<void> {
    const p = this.sketchesMap.get(sketch);
    if (!p) return;

    const { compiler, watching, outputPath } = p;
    watching?.close();
    compiler?.close((_) => {});

    if (outputPath) await Deno.remove(outputPath, { recursive: true });
  }

  async compile({ ctx, sketch, onWatch }: CompileOptions) {
    const { config } = this.sketchesMap.get(sketch)!;
    const tempOutputDir = await Deno.makeTempDir({
      dir: Deno.cwd(),
      prefix: `__milka_${sketch}__`,
    });

    const {
      entry: configEntries,
      metadata,
    } = await config.getCompilationEntries();
    const plugins = [
      new rspack.HtmlRspackPlugin({
        filename: 'index.html',
        title: sketch,
        template: path.join(MilkaCompiler.staticDir, 'base_canvas.html'),
        publicPath: `/${sketch}`,
        scriptLoading: 'blocking',
      }),
      WSScriptPlugin,
      P5InjectPlugin(
        sketch,
        config.config.outputName,
        config.compilationEntry,
      ),
    ];

    const bundledEntries = configEntries as Entry;
    const compiler = rspack({
      plugins,
      mode: 'development',
      name: `milka-build-${sketch}`,
      entry: bundledEntries,
      output: {
        path: tempOutputDir,
        filename: (pathData) => {
          const name = pathData.chunk?.name;
          if (metadata && name && metadata.dirPaths?.has(name)) {
            return `${metadata.dirPaths.get(name)}[name].js`;
          }

          return '[name].js';
        },
        clean: true,
      },
    });

    const watching = await new Promise<Watching>((resolve) => {
      const w = compiler.watch(
        { ignored: [MilkaCompiler.staticDir] },
        (err, stats) => {
          if (err || stats?.hasErrors()) {
            console.log(stats?.hasErrors, err);
            ctx.throw(
              Status.InternalServerError,
              `Error when compiling ${sketch}`,
            );
          }

          onWatch?.();
          endHandler(resolve);
        },
      );

      const endHandler = (resolver: (value: Watching) => void) => {
        resolver(w);
      };
    });

    const sketchC = { compiler, watching, outputPath: tempOutputDir };
    this.sketchesMap.set(sketch, { config, ...sketchC });

    return this.sketchesMap.get(sketch)!;
  }
}
