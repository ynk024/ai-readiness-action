import { fileExists, findFiles } from '../utils/file-utils.js';
import { getPackageJson, hasDependency } from '../utils/package-parser.js';
import { parsePomXml, hasMavenPlugin } from '../utils/maven-parser.js';
import { parseGradleBuild, hasGradlePlugin } from '../utils/gradle-parser.js';

/**
 * Check for code formatters
 * @param {Object} languages - Detected languages
 * @returns {Promise<Object>}
 */
export async function checkFormatters(languages) {
  console.log('[formatter-checker] Starting formatter check...');
  const result = {
    javascript: {},
    java: {}
  };

  // JavaScript/TypeScript formatters
  if (languages.detected.includes('javascript') || languages.detected.includes('typescript')) {
    console.log('[formatter-checker] Checking for Prettier configuration...');
    // Check for Prettier
    const prettierConfigs = [
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.js',
      '.prettierrc.cjs',
      'prettier.config.js',
      'prettier.config.cjs'
    ];

    let prettierConfigFile = null;
    for (const config of prettierConfigs) {
      if (await fileExists(config)) {
        prettierConfigFile = config;
        console.log(`[formatter-checker] Found Prettier config: ${config}`);
        break;
      }
    }

    // Check package.json for prettier config
    if (!prettierConfigFile) {
      console.log('[formatter-checker] No standalone Prettier config found, checking package.json...');
      const packageJson = await getPackageJson();
      if (packageJson && packageJson.prettier) {
        prettierConfigFile = 'package.json';
        console.log('[formatter-checker] Found Prettier config in package.json');
      }
    }

    result.javascript.prettier = {
      present: prettierConfigFile !== null,
      config_file: prettierConfigFile
    };
    console.log(`[formatter-checker] Prettier result: ${prettierConfigFile !== null ? 'present' : 'not present'}`);
  }

  // Java formatters
  if (languages.detected.includes('java')) {
    result.java.checkstyle = { present: false };
    result.java.spotless = { present: false };
    result.java.google_java_format = { present: false };

    // Check Maven
    const pom = await parsePomXml();
    if (pom) {
      if (hasMavenPlugin(pom, 'maven-checkstyle-plugin')) {
        result.java.checkstyle = { present: true, build_file: 'pom.xml' };
      }
      if (hasMavenPlugin(pom, 'spotless-maven-plugin')) {
        result.java.spotless = { present: true, build_file: 'pom.xml' };
      }
    }

    // Check Gradle
    const gradle = await parseGradleBuild();
    if (gradle) {
      const gradleFile = await fileExists('build.gradle') ? 'build.gradle' : 'build.gradle.kts';
      
      if (hasGradlePlugin(gradle, 'checkstyle')) {
        result.java.checkstyle = { present: true, build_file: gradleFile };
      }
      if (hasGradlePlugin(gradle, 'com.diffplug.spotless') || hasGradlePlugin(gradle, 'spotless')) {
        result.java.spotless = { present: true, build_file: gradleFile };
      }
      if (hasGradlePlugin(gradle, 'com.google.googlejavaformat')) {
        result.java.google_java_format = { present: true, build_file: gradleFile };
      }
    }
  }

  return result;
}
