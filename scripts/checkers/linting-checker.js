import { fileExists } from '../utils/file-utils.js';
import { getPackageJson } from '../utils/package-parser.js';
import { parsePomXml, hasMavenPlugin } from '../utils/maven-parser.js';
import { parseGradleBuild, hasGradlePlugin } from '../utils/gradle-parser.js';

/**
 * Check for linting tools
 * @param {Object} languages - Detected languages
 * @returns {Promise<Object>}
 */
export async function checkLinting(languages) {
  const result = {
    javascript: {},
    java: {}
  };

  // JavaScript/TypeScript linting
  if (languages.detected.includes('javascript') || languages.detected.includes('typescript')) {
    const eslintConfigs = [
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.json',
      '.eslintrc.yml',
      '.eslintrc.yaml',
      'eslint.config.js',
      'eslint.config.cjs',
      'eslint.config.mjs'
    ];

    let eslintConfigFile = null;
    for (const config of eslintConfigs) {
      if (await fileExists(config)) {
        eslintConfigFile = config;
        break;
      }
    }

    // Check package.json for eslintConfig
    if (!eslintConfigFile) {
      const packageJson = await getPackageJson();
      if (packageJson && packageJson.eslintConfig) {
        eslintConfigFile = 'package.json';
      }
    }

    result.javascript.eslint = {
      present: eslintConfigFile !== null,
      config_file: eslintConfigFile
    };
  }

  // Java linting
  if (languages.detected.includes('java')) {
    result.java.spotbugs = { present: false };
    result.java.pmd = { present: false };

    // Check Maven
    const pom = await parsePomXml();
    if (pom) {
      if (hasMavenPlugin(pom, 'spotbugs-maven-plugin')) {
        result.java.spotbugs = { present: true, build_file: 'pom.xml' };
      }
      if (hasMavenPlugin(pom, 'maven-pmd-plugin')) {
        result.java.pmd = { present: true, build_file: 'pom.xml' };
      }
    }

    // Check Gradle
    const gradle = await parseGradleBuild();
    if (gradle) {
      const gradleFile = await fileExists('build.gradle') ? 'build.gradle' : 'build.gradle.kts';
      
      if (hasGradlePlugin(gradle, 'com.github.spotbugs') || hasGradlePlugin(gradle, 'spotbugs')) {
        result.java.spotbugs = { present: true, build_file: gradleFile };
      }
      if (hasGradlePlugin(gradle, 'pmd')) {
        result.java.pmd = { present: true, build_file: gradleFile };
      }
    }
  }

  return result;
}
