import { type ResolvedPath, type SketchFs } from '@/sketch_fs'
import { assert } from '@std/assert/assert'

export class SketchRequest {
  readonly requestPath: string
  private readonly sketchFs: SketchFs

  /** Path for the resolved file; only if the request is done on a sketch file */
  resolvedFile?: string

  /** Resolved request into a sketch */
  resolvedSketch?: ResolvedPath

  constructor(requestPath: string, sketchFs: SketchFs) {
    this.requestPath = requestPath
    this.sketchFs = sketchFs
  }

  get isFileRequest() {
    return this.requestPath.split('/').at(-1)?.includes('.')
  }

  get isResolvedPath() {
    if (this.isFileRequest) {
      this.resolvedFile = this.sketchFs.resolveFileRequest(this.requestPath)

      const splitReq = this.requestPath.split('/')
      let resolvedSketch: ResolvedPath | undefined
      let reqIndex = 0
      while (reqIndex < splitReq.length && !resolvedSketch) {
        const currentCheck = splitReq.slice(0, reqIndex).join('/')
        resolvedSketch = this.sketchFs.resolveSketchRequest(currentCheck)
        reqIndex++
      }

      this.resolvedSketch = resolvedSketch

      return !!this.resolvedFile && !!this.resolvedSketch
    }

    this.resolvedSketch = this.sketchFs.resolveSketchRequest(this.requestPath)
    return !!this.resolvedSketch
  }

  get sketchName() {
    assert(this.resolvedSketch)
    return this.resolvedSketch.sketchName
  }

  get relativeFileRequestPath() {
    return this.requestPath.replace(`${this.sketchName}/`, '')
  }
}
