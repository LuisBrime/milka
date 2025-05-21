import { SketchFs } from './sketch_fs.ts'

let sketchFileTree: SketchFs

export const getSketchFs = async () => {
  if (!sketchFileTree) {
    sketchFileTree = new SketchFs()
    await sketchFileTree.buildFsTree()
  }

  return sketchFileTree
}

export * from './sketch_fs.ts'
