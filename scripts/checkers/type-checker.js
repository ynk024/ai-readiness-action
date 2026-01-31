import { fileExists } from '../utils/file-utils.js';

/**
 * Check for type checking tools
 * @param {Object} languages - Detected languages
 * @returns {Promise<Object>}
 */
export async function checkTypeChecking(languages) {
  const result = {
    typescript: {},
    java: {}
  };

  // TypeScript
  if (languages.detected.includes('typescript')) {
    const hasTsConfig = await fileExists('tsconfig.json');
    result.typescript = {
      present: hasTsConfig,
      config_file: hasTsConfig ? 'tsconfig.json' : null
    };
  }

  // Java (built-in type system)
  if (languages.detected.includes('java')) {
    result.java = {
      present: true,
      builtin: true
    };
  }

  return result;
}
