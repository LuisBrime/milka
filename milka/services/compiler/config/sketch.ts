import { type EntryDescription, type EntryObject } from '@rspack/core';
import * as path from '@std/path';
import { walk } from '@std/fs/walk';

import { type ResolvedPath } from '@/services/fs';

// export type SketchDrawingLib = 'p5'

/** Configuration for a sketch if multiple
 * files are used */
export interface SketchConfig {
  // drawingLib: SketchDrawingLib
  // bundleAll: boolean
  entry: string;
  outputName: string;
}

interface SketchConfigurationConstructor {
  sketchName: string;
  config?: SketchConfig;
  isFile?: boolean;
  isDir?: boolean;
  path: string;
}

interface BundledEntriesMetadata {
  dirPaths: Map<string, string>;
}

const defaultConfig: SketchConfig = {
  // drawingLib: 'p5',
  // bundleAll: true,
  entry: 'sketch',
  outputName: 'sketch',
};

const getStats = async (path: string): Promise<Deno.FileInfo | undefined> => {
  try {
    const st = await Deno.lstat(path);
    return st;
  } catch (_) {
    return;
  }
};

export class SketchConfiguration {
  readonly sketchName: string;
  readonly config: SketchConfig;
  readonly isFile: boolean;
  readonly isDir: boolean;
  readonly path: string;
  _compilationEntry: string | string[];

  get compilationEntry(): string | string[] {
    if (!Array.isArray(this._compilationEntry)) {
      return this._compilationEntry;
    }

    // Move sketch main file to the end
    const secondary = this._compilationEntry.filter((e) =>
      e !== this.config.outputName
    );
    return [...secondary, this.config.outputName];
  }

  constructor(
    {
      sketchName,
      path,
      config = defaultConfig,
      isFile = false,
      isDir = false,
    }: SketchConfigurationConstructor,
  ) {
    this.sketchName = sketchName;
    this.config = config;
    this.isFile = isFile;
    this.isDir = isDir;
    this.path = path;
    this._compilationEntry = this.isFile ? '' : [];
  }

  static async fromResolvedSketch(
    resolved: ResolvedPath,
    extendFrom?: SketchConfig,
  ): Promise<SketchConfiguration | undefined> {
    if (resolved.isFile) {
      return new SketchConfiguration({
        sketchName: resolved.sketchName,
        path: resolved.fsPath,
        config: extendFrom,
        isFile: true,
      });
    }

    if (resolved.isDir) {
      const configFile = await SketchConfiguration.readConfig(resolved.fsPath);
      return new SketchConfiguration({
        sketchName: resolved.sketchName,
        path: resolved.fsPath,
        config: extendFrom ?? configFile,
        isDir: true,
      });
    }
  }

  private static async readConfig(
    sketchPath: string,
  ): Promise<SketchConfig | undefined> {
    const milkaConfig = path.join(sketchPath, 'milka.config.ts');
    const st = await getStats(milkaConfig);
    if (!st) return;

    const { config } = await import(milkaConfig);
    const parsed = defaultConfig;
    for (const [k, v] of Object.entries<string | boolean | undefined>(config)) {
      if (['drawingLib', 'bundleAll', 'entry', 'outputName'].includes(k)) {
        const pk = k as keyof SketchConfig;
        Object.assign(parsed, { [pk]: v });
      }
    }

    return parsed;
  }

  /**
   * @returns entry object or list of objects for rspack compiler based on config
   */
  async getCompilationEntries(): Promise<
    { entry: EntryObject; metadata?: BundledEntriesMetadata }
  > {
    if (this.isFile) {
      this._compilationEntry = this.config.entry;
      return {
        entry: {
          [this.config.entry]: {
            import: this.path,
            library: {
              name: this.sketchName,
              type: 'var',
              export: 'default',
            },
          },
        },
      };
    }

    const entries: Record<string, EntryDescription> = {};
    const dirPaths = new Map<string, string>();
    this._compilationEntry = [];
    for await (const dirEntry of walk(this.path, { exts: ['js'] })) {
      const entryName = dirEntry.name;
      const isEntry = entryName.includes(this.config.entry);
      const entryKey = isEntry
        ? this.config.outputName
        : entryName.replace('.js', '');

      const relativePath = path.relative(this.path, dirEntry.path);
      if (relativePath.split('/').filter((r) => r !== '/').length > 1) {
        dirPaths.set(entryKey, relativePath.replace(entryName, ''));
      }

      this._compilationEntry.push(entryKey);
      entries[entryKey] = {
        import: dirEntry.path,
        library: {
          name: isEntry ? this.sketchName : entryKey,
          type: 'var',
          export: 'default',
        },
      };
    }

    if (this.compilationEntry.length === 1) {
      this._compilationEntry = this._compilationEntry[0];
    }

    return { entry: entries, metadata: { dirPaths } };
  }
}
