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
  console.log('[linting-checker] Starting linting check...');
  const result = {
    javascript: {},
    java: {}
  };

  // JavaScript/TypeScript linting
  if (languages.detected.includes('javascript') || languages.detected.includes('typescript')) {
    console.log('[linting-checker] Checking for ESLint configuration...');
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
        console.log(`[linting-checker] Found ESLint config: ${config}`);
        break;
      }
    }

    // Check package.json for eslintConfig
    if (!eslintConfigFile) {
      console.log('[linting-checker] No standalone ESLint config found, checking package.json...');
      const packageJson = await getPackageJson();
      if (packageJson && packageJson.eslintConfig) {
        eslintConfigFile = 'package.json';
        console.log('[linting-checker] Found ESLint config in package.json');
      }
    }

    result.javascript.eslint = {
      present: eslintConfigFile !== null,
      config_file: eslintConfigFile
    };
    console.log(`[linting-checker] ESLint result: ${eslintConfigFile !== null ? 'present' : 'not present'}`);
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
