import * as path from 'jsr:@std/path'
import { walk } from 'jsr:@std/fs/walk'
import {
  type Entry,
  type EntryDescription,
  type EntryObject,
} from 'npm:@rspack/core'

// export type ProjectDrawingLib = 'p5'

/** Configuration for a project (sketch) if multiple
 * files are used */
export interface ProjectConfig {
  // drawingLib: ProjectDrawingLib
  // bundleAll: boolean
  entry: string
  outputName: string
}

interface ProjectConfigurationConstructor {
  projectName: string
  config?: ProjectConfig
  isFile?: boolean
  isDir?: boolean
  path: string
}

const defaultConfig: ProjectConfig = {
  // drawingLib: 'p5',
  // bundleAll: true,
  entry: 'sketch',
  outputName: 'sketch',
}

const getStats = async (path: string): Promise<Deno.FileInfo | undefined> => {
  try {
    const st = await Deno.lstat(path)
    return st
  } catch (_) {
    return
  }
}

export class ProjectConfiguration {
  readonly projectName: string
  readonly config: ProjectConfig
  readonly isFile: boolean
  readonly isDir: boolean
  readonly path: string
  _compilationEntry: string | string[]

  static projectsDir = path.resolve(Deno.cwd(), 'projects')

  get compilationEntry(): string | string[] {
    if (!Array.isArray(this._compilationEntry)) {
      return this._compilationEntry
    }

    // Move sketch main file to the end
    const secondary = this._compilationEntry.filter((e) =>
      e !== this.config.outputName
    )
    return [...secondary, this.config.outputName]
  }

  constructor(
    {
      projectName,
      path,
      config = defaultConfig,
      isFile = false,
      isDir = false,
    }: ProjectConfigurationConstructor,
  ) {
    this.projectName = projectName
    this.config = config
    this.isFile = isFile
    this.isDir = isDir
    this.path = path
    this._compilationEntry = this.isFile ? '' : []
  }

  static async fromProjectPath(
    projectName: string,
    extendFrom?: ProjectConfig,
  ): Promise<ProjectConfiguration | undefined> {
    const filePath = path.join(
      ProjectConfiguration.projectsDir,
      `${projectName}.js`,
    )
    let st = await getStats(filePath)
    if (st) {
      return new ProjectConfiguration({
        projectName,
        path: filePath,
        config: extendFrom,
        isFile: true,
      })
    }

    const dirPath = path.join(ProjectConfiguration.projectsDir, projectName)
    st = await getStats(dirPath)
    if (st) {
      const configFile = await ProjectConfiguration.readConfig(dirPath)
      return new ProjectConfiguration({
        projectName,
        path: dirPath,
        config: configFile ?? extendFrom,
        isDir: true,
      })
    }
  }

  static async readConfig(
    projectPath: string,
  ): Promise<ProjectConfig | undefined> {
    const milkaConfig = path.join(projectPath, 'milka.config.ts')
    const st = await getStats(milkaConfig)
    if (!st) return

    const { config } = await import(milkaConfig)
    const parsed = defaultConfig
    for (const [k, v] of Object.entries<string | boolean | undefined>(config)) {
      if (['drawingLib', 'bundleAll', 'entry', 'outputName'].includes(k)) {
        const pk = k as keyof ProjectConfig
        Object.assign(parsed, { [pk]: v })
      }
    }

    return parsed
  }

  /**
   * @returns entry values for rspack compiler based on config
   */
  async getCompilationEntries(): Promise<EntryObject | Entry[]> {
    if (this.isFile) {
      this._compilationEntry = this.config.entry
      return {
        [this.config.entry]: {
          import: this.path,
          library: {
            name: this.projectName,
            type: 'var',
            export: 'default',
          },
        },
      }
    }

    const entries: Record<string, EntryDescription> = {}
    this._compilationEntry = []
    for await (const dirEntry of walk(this.path, { exts: ['js'] })) {
      const fileName = dirEntry.name
      const isEntry = fileName.includes(this.config.entry)
      const entryKey = isEntry
        ? this.config.outputName
        : fileName.replace('.js', '')

      this._compilationEntry.push(entryKey)
      entries[entryKey] = {
        import: dirEntry.path,
        library: {
          name: isEntry ? this.projectName : entryKey,
          type: 'var',
          export: isEntry ? 'default' : 'default',
        },
      }
    }

    if (this.compilationEntry.length === 1) {
      this._compilationEntry = this._compilationEntry[0]
    }

    return entries
  }
}
