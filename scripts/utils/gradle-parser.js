import { fileExists, readFileContent } from './file-utils.js';

/**
 * Parse Gradle build file (build.gradle or build.gradle.kts)
 * @returns {Promise<{content: string}|null>} - Object with file content or null if not found
 */
export async function parseGradleBuild() {
  // Try build.gradle first
  if (await fileExists('build.gradle')) {
    const content = await readFileContent('build.gradle');
    return { content };
  }

  // Try build.gradle.kts
  if (await fileExists('build.gradle.kts')) {
    const content = await readFileContent('build.gradle.kts');
    return { content };
  }

  return null;
}

/**
 * Check if Gradle build file contains a specific plugin
 * @param {Object|null} gradle - Parsed gradle build
 * @param {string} pluginId - Plugin ID to check
 * @returns {boolean}
 */
export function hasGradlePlugin(gradle, pluginId) {
  if (!gradle || !gradle.content) {
    return false;
  }

  const content = gradle.content;

  // Check for: id 'plugin-name' or id("plugin-name") or just the plugin name in plugins block
  const patterns = [
    new RegExp(`id\\s+['"]${escapeRegex(pluginId)}['"]`, 'm'),  // id 'plugin'
    new RegExp(`id\\(['"]${escapeRegex(pluginId)}['"]\\)`, 'm'), // id("plugin")
    new RegExp(`^\\s+${escapeRegex(pluginId)}\\s*$`, 'm'),        // just: plugin
    new RegExp(`apply\\s+plugin:\\s+['"]${escapeRegex(pluginId)}['"]`, 'm'), // apply plugin: 'plugin'
  ];

  return patterns.some(pattern => pattern.test(content));
}

/**
 * Check if Gradle build file contains a specific dependency
 * @param {Object|null} gradle - Parsed gradle build
 * @param {string|null} groupId - Group ID (optional)
 * @param {string} artifactId - Artifact ID
 * @returns {boolean}
 */
export function hasGradleDependency(gradle, groupId, artifactId) {
  if (!gradle || !gradle.content) {
    return false;
  }

  const content = gradle.content;

  // Build search patterns
  const patterns = [];

  if (groupId) {
    // Full group:artifact pattern
    // Matches: 'group:artifact' or "group:artifact" or ('group:artifact') or ("group:artifact")
    patterns.push(
      new RegExp(`['"]${escapeRegex(groupId)}:${escapeRegex(artifactId)}`, 'm'),
      new RegExp(`\\(['"]${escapeRegex(groupId)}:${escapeRegex(artifactId)}`, 'm')
    );
  } else {
    // Just artifact ID (less precise)
    patterns.push(
      new RegExp(`:${escapeRegex(artifactId)}[:']`, 'm')
    );
  }

  return patterns.some(pattern => pattern.test(content));
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
