import { fileExists } from './file-utils.js';

/**
 * Detect programming languages used in the repository
 * Priority order: TypeScript > first detected language
 * Detection order: JavaScript -> TypeScript -> Java (ensures consistent ordering)
 * @returns {Promise<{detected: string[], primary: string|null}>}
 */
export async function detectLanguages() {
  console.log('[language-detector] Starting language detection...');
  const detected = [];
  let primary = null;

  // Check in order to ensure consistent results
  
  // Check for JavaScript
  console.log('[language-detector] Checking for JavaScript (package.json)...');
  const hasJavaScript = await fileExists('package.json');
  if (hasJavaScript) {
    detected.push('javascript');
    if (!primary) {
      primary = 'javascript';
    }
    console.log('[language-detector] JavaScript detected');
  }

  // Check for TypeScript (always overrides primary if present)
  console.log('[language-detector] Checking for TypeScript (tsconfig.json)...');
  const hasTypeScript = await fileExists('tsconfig.json');
  if (hasTypeScript) {
    detected.push('typescript');
    primary = 'typescript'; // TypeScript takes priority
    console.log('[language-detector] TypeScript detected (set as primary)');
  }

  // Check for Java (Maven, Gradle, or Gradle Kotlin DSL)
  console.log('[language-detector] Checking for Java (pom.xml, build.gradle*)...');
  const hasJava = 
    await fileExists('pom.xml') ||
    await fileExists('build.gradle') ||
    await fileExists('build.gradle.kts');

  if (hasJava) {
    detected.push('java');
    if (!primary) {
      primary = 'java';
    }
    console.log('[language-detector] Java detected');
  }

  console.log(`[language-detector] Detection complete - detected: [${detected.join(', ')}], primary: ${primary || 'none'}`);
  return { detected, primary };
}
