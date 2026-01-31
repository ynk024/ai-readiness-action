import { getPackageJson, hasDependency, getDependencyVersion } from '../utils/package-parser.js';
import { parsePomXml, hasMavenDependency } from '../utils/maven-parser.js';
import { parseGradleBuild, hasGradleDependency } from '../utils/gradle-parser.js';

/**
 * Check for architecture testing tools
 * @param {Object} languages - Detected languages
 * @returns {Promise<Object>}
 */
export async function checkArchitectureTests(languages) {
  const result = {
    javascript: {},
    java: {}
  };

  // JavaScript/TypeScript architecture tests
  if (languages.detected.includes('javascript') || languages.detected.includes('typescript')) {
    const packageJson = await getPackageJson();
    
    // Check for eslint-plugin-boundaries
    if (packageJson && hasDependency(packageJson, 'eslint-plugin-boundaries')) {
      const version = getDependencyVersion(packageJson, 'eslint-plugin-boundaries');
      result.javascript.eslint_boundaries = {
        present: true,
        package: 'eslint-plugin-boundaries',
        version
      };
    } else {
      result.javascript.eslint_boundaries = {
        present: false
      };
    }
  }

  // Java architecture tests
  if (languages.detected.includes('java')) {
    result.java.archunit = { present: false };

    // Check Maven
    const pom = await parsePomXml();
    if (pom && hasMavenDependency(pom, 'archunit')) {
      result.java.archunit = {
        present: true,
        build_file: 'pom.xml'
      };
    }

    // Check Gradle
    if (!result.java.archunit.present) {
      const gradle = await parseGradleBuild();
      if (gradle && hasGradleDependency(gradle, 'com.tngtech.archunit', 'archunit')) {
        result.java.archunit = {
          present: true,
          build_file: 'build.gradle'
        };
      }
    }
  }

  return result;
}
