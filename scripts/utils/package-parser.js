import { readJsonFile } from './file-utils.js';

/**
 * Read and parse package.json
 * @returns {Promise<Object|null>} - Parsed package.json or null if not found
 */
export async function getPackageJson() {
  return await readJsonFile('package.json');
}

/**
 * Check if a package has a specific dependency
 * Checks both dependencies and devDependencies
 * @param {Object|null} packageJson - Parsed package.json
 * @param {string} name - Package name to check
 * @returns {boolean}
 */
export function hasDependency(packageJson, name) {
  if (!packageJson) {
    return false;
  }

  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  return name in dependencies || name in devDependencies;
}

/**
 * Get the version of a specific dependency
 * Checks dependencies first, then devDependencies
 * @param {Object|null} packageJson - Parsed package.json
 * @param {string} name - Package name
 * @returns {string|null} - Version string or null if not found
 */
export function getDependencyVersion(packageJson, name) {
  if (!packageJson) {
    return null;
  }

  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  // Prefer dependencies over devDependencies
  if (name in dependencies) {
    return dependencies[name];
  }

  if (name in devDependencies) {
    return devDependencies[name];
  }

  return null;
}
