import { SketchConfig, SketchConfiguration } from './sketch.ts'

import { type ResolvedPath } from '@/sketch_fs'

/**
 * @param sketchPath file path for the sketch to be configured.
 * @param extendFrom optional extended configuration.
 */
export const setSketchConfig = async (
  resolved: ResolvedPath,
  extendFrom?: SketchConfig,
) => {
  const config = await SketchConfiguration.fromResolvedSketch(
    resolved,
    extendFrom,
  )
  return config
}

export * from './sketch.ts'
