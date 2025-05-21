import { join, parse, resolve } from 'jsr:@std/path'

type FsNode = 'sketchStandAlone' | 'sketchMult' | 'dir'

interface NodeConstructor {
  name: string
  fsPath: string
  requestPath: string
  type?: FsNode
}

export interface ResolvedPath {
  requestPath: string
  sketchName: string
  fsPath: string
  isDir: boolean
  isFile: boolean
}

abstract class SketchFsNode {
  name: string
  fsPath: string
  requestPath: string
  type: FsNode
  children: Map<string, SketchFsNode>
  isSketch: boolean = false

  constructor({ name, fsPath, requestPath, type }: NodeConstructor) {
    this.name = name
    this.fsPath = fsPath
    this.requestPath = requestPath
    this.type = type ?? 'sketchStandAlone'
    this.children = new Map()
  }

  addChild(node: SketchFsNode) {
    this.children.set(node.name, node)
  }

  getChild(name: string) {
    return this.children.get(name)
  }

  hasChildren() {
    return this.children.size > 0
  }

  getChildren() {
    return Array.from(this.children.values())
  }
}

class SketchStandAlone extends SketchFsNode {
  constructor(name: string, fsPath: string, requestPath: string) {
    super({ name, fsPath, requestPath, type: 'sketchStandAlone' })
  }

  get cleanName() {
    const dotIndex = this.name.lastIndexOf('.')
    return dotIndex > 0 ? this.name.substring(0, dotIndex) : this.name
  }
}

// class SketchMult extends SketchFsNode {
//   constructor(name: string, fsPath: string, requestPath: string) {
//     super({ name, fsPath, requestPath, type: 'sketchMult' })
//   }
// }

class SketchDir extends SketchFsNode {
  constructor(name: string, fsPath: string, requestPath: string) {
    super({ name, fsPath, requestPath, type: 'dir' })
  }
}

export class SketchFs {
  readonly rootDir: string

  /** Map request paths to file system paths for quick lookup */
  fileRequestToSystem: Map<string, string>
  sketchRequestToResolved: Map<string, ResolvedPath>

  /** Root for sketches' FileSystem tree */
  root?: SketchFsNode

  constructor() {
    this.rootDir = resolve(Deno.cwd(), 'sketches')
    this.fileRequestToSystem = new Map()
    this.sketchRequestToResolved = new Map()
  }

  async buildFsTree() {
    const rootNode = new SketchDir(parse(this.rootDir).name, this.rootDir, '/')

    await this.buildRecursiveTree(rootNode, this.rootDir, '/')
    this.root = rootNode

    await this.resolveSketches()
  }

  resolveSketchRequest(requestPath: string) {
    const splitReq = requestPath.split('/')
    const isFileReq = splitReq.at(-1)?.includes('.')

    return this._resolveRequest(
      isFileReq ? splitReq.slice(0, -1).join('/') : requestPath,
      true,
    ) as ResolvedPath | undefined
  }

  resolveFileRequest(requestPath: string) {
    return this._resolveRequest(requestPath, false) as string | undefined
  }

  private _resolveRequest(path: string, sketchMap: boolean) {
    const normalized = path.startsWith('/') ? path : `/${path}`

    return this[sketchMap ? 'sketchRequestToResolved' : 'fileRequestToSystem']
      .get(normalized)
  }

  private async buildRecursiveTree(
    parentNode: SketchFsNode,
    currentFsPath: string,
    currentRequestPath: string,
  ) {
    let entries: AsyncIterable<Deno.DirEntry>
    try {
      entries = Deno.readDir(currentFsPath)
    } catch (_) {
      return
    }

    for await (const entry of entries) {
      const entryFsPath = join(currentFsPath, entry.name)
      if (entry.isDirectory) {
        const isBracketed = this.isBracketDir(entry.name)
        const entryReqPath = isBracketed
          ? currentRequestPath
          : this.joinRequestPath(currentRequestPath, entry.name)

        const dirNode = new SketchDir(
          entry.name,
          entryFsPath,
          entryReqPath,
        )

        let next = parentNode
        if (!isBracketed) {
          next = dirNode
          parentNode.addChild(dirNode)
        }

        await this.buildRecursiveTree(next, entryFsPath, entryReqPath)
      } else if (entry.isFile) {
        const fileReqPath = this.joinRequestPath(currentRequestPath, entry.name)
        const fileNode = new SketchStandAlone(
          entry.name,
          entryFsPath,
          fileReqPath,
        )

        parentNode.addChild(fileNode)

        // Config should not be requestable
        if (fileNode.name !== 'milka.config.ts') {
          this.fileRequestToSystem.set(fileReqPath, entryFsPath)
        }
      }
    }
  }

  private async resolveSketches() {
    const nodeQ = [...this.root!.getChildren()]

    while (nodeQ.length) {
      const currentNode = nodeQ.shift()
      if (!currentNode) continue

      switch (currentNode.type) {
        case 'sketchStandAlone': {
          const standAlone = currentNode as SketchStandAlone
          if (
            standAlone.requestPath.replace('/', '') === standAlone.name
          ) {
            const sketchReqPath = standAlone.requestPath.replace(
              standAlone.name,
              standAlone.cleanName,
            )

            this.fileRequestToSystem.set(
              `${sketchReqPath}/sketch.js`,
              standAlone.fsPath,
            )

            standAlone.isSketch = true
            this.sketchRequestToResolved.set(sketchReqPath, {
              sketchName: standAlone.cleanName,
              requestPath: sketchReqPath,
              fsPath: standAlone.fsPath,
              isFile: true,
              isDir: false,
            })
            continue
          }
          break
        }
        case 'sketchMult':
        case 'dir': {
          const configFile = currentNode.getChild('milka.config.ts')
          let sketchEntryName = 'sketch'
          let outputName = 'sketch'
          if (configFile) {
            const { config } = await import(configFile!.fsPath)
            sketchEntryName = config.entry ?? sketchEntryName
            outputName = config.outputName ?? outputName
          }

          const entryChild = currentNode.getChild(`${sketchEntryName}.js`)
          if (entryChild) {
            if (sketchEntryName !== outputName) {
              this.handleRenamedOutput(entryChild, outputName)
            }

            currentNode.isSketch = true
            this.sketchRequestToResolved.set(currentNode.requestPath, {
              sketchName: currentNode.name,
              requestPath: currentNode.requestPath,
              fsPath: currentNode.fsPath,
              isFile: false,
              isDir: true,
            })
            continue
          } else {
            nodeQ.push(...currentNode!.getChildren())
          }
          break
        }
      }
    }
  }

  private handleRenamedOutput(entry: SketchFsNode, outputName: string) {
    const output = `${outputName}.js`
    const outputReqPath = entry.requestPath.replace(entry.name, output)
    const outputFsPath = entry.fsPath.replace(entry.name, output)
    this.fileRequestToSystem.set(outputReqPath, outputFsPath)
  }

  private isBracketDir(name: string) {
    return name.startsWith('[') && name.endsWith(']')
  }

  private joinRequestPath(base: string, segment: string) {
    const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')
    return `${normalizedBase}/${segment}`
  }
}
