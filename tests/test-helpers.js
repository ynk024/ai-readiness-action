import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Creates a temporary test directory with specified files
 * @param {Object} files - Object with file paths as keys and content as values
 * @returns {Promise<{dir: string, cleanup: Function}>}
 */
export async function createTestFixture(files = {}) {
  const dir = join(tmpdir(), `ai-readiness-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(dir, filePath);
    const dirPath = join(fullPath, '..');
    await mkdir(dirPath, { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  }

  const cleanup = async () => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  return { dir, cleanup };
}

/**
 * Mock process.cwd() for tests
 * @param {string} dir - Directory to use as cwd
 * @param {Function} fn - Test function to run
 */
export async function withCwd(dir, fn) {
  const originalCwd = process.cwd();
  try {
    process.chdir(dir);
    await fn();
  } finally {
    process.chdir(originalCwd);
  }
}
