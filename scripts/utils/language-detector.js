import { fileExists } from './file-utils.js';

/**
 * Detect programming languages used in the repository
 * Priority order: TypeScript > first detected language
 * Detection order: JavaScript -> TypeScript -> Java (ensures consistent ordering)
 * @returns {Promise<{detected: string[], primary: string|null}>}
 */
export async function detectLanguages() {
  const detected = [];
  let primary = null;

  // Check in order to ensure consistent results
  
  // Check for JavaScript
  const hasJavaScript = await fileExists('package.json');
  if (hasJavaScript) {
    detected.push('javascript');
    if (!primary) {
      primary = 'javascript';
    }
  }

  // Check for TypeScript (always overrides primary if present)
  const hasTypeScript = await fileExists('tsconfig.json');
  if (hasTypeScript) {
    detected.push('typescript');
    primary = 'typescript'; // TypeScript takes priority
  }

  // Check for Java (Maven, Gradle, or Gradle Kotlin DSL)
  const hasJava = 
    await fileExists('pom.xml') ||
    await fileExists('build.gradle') ||
    await fileExists('build.gradle.kts');

  if (hasJava) {
    detected.push('java');
    if (!primary) {
      primary = 'java';
    }
  }

  return { detected, primary };
}
