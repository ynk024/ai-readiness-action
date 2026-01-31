import { readXmlFile } from './file-utils.js';

/**
 * Parse pom.xml file
 * @returns {Promise<Object|null>} - Parsed pom.xml or null if not found
 */
export async function parsePomXml() {
  return await readXmlFile('pom.xml');
}

/**
 * Check if pom.xml contains a specific plugin
 * @param {Object|null} pom - Parsed pom.xml
 * @param {string} artifactId - Plugin artifact ID
 * @returns {boolean}
 */
export function hasMavenPlugin(pom, artifactId) {
  if (!pom || !pom.project) {
    return false;
  }

  try {
    const build = pom.project.build;
    if (!build || !Array.isArray(build)) {
      return false;
    }

    for (const buildSection of build) {
      if (buildSection.plugins && Array.isArray(buildSection.plugins)) {
        for (const pluginsSection of buildSection.plugins) {
          if (pluginsSection.plugin && Array.isArray(pluginsSection.plugin)) {
            for (const plugin of pluginsSection.plugin) {
              if (plugin.artifactId && Array.isArray(plugin.artifactId)) {
                if (plugin.artifactId.includes(artifactId)) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    return false;
  }

  return false;
}

/**
 * Check if pom.xml contains a specific dependency
 * @param {Object|null} pom - Parsed pom.xml
 * @param {string} artifactId - Dependency artifact ID
 * @returns {boolean}
 */
export function hasMavenDependency(pom, artifactId) {
  if (!pom || !pom.project) {
    return false;
  }

  try {
    const dependencies = pom.project.dependencies;
    if (!dependencies || !Array.isArray(dependencies)) {
      return false;
    }

    for (const dependenciesSection of dependencies) {
      if (dependenciesSection.dependency && Array.isArray(dependenciesSection.dependency)) {
        for (const dependency of dependenciesSection.dependency) {
          if (dependency.artifactId && Array.isArray(dependency.artifactId)) {
            if (dependency.artifactId.includes(artifactId)) {
              return true;
            }
          }
        }
      }
    }
  } catch (error) {
    return false;
  }

  return false;
}
