import { ProjectConfig, ProjectConfiguration } from './project.ts'

/**
 * @param projectName
 * @param extendFrom
 */
export const setProjectConfig = async (
  projectName: string,
  extendFrom?: ProjectConfig,
) => {
  const config = await ProjectConfiguration.fromProjectPath(
    projectName,
    extendFrom,
  )
  return config
}

export * from './project.ts'
