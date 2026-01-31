import { access, readFile, stat } from 'fs/promises';
import { constants } from 'fs';
import { glob as globPkg } from 'glob';
import { parseStringPromise } from 'xml2js';
import { join, basename, resolve } from 'path';

/**
 * Get the target directory to analyze
 * If we're in .ai-readiness-action, analyze parent directory (..)
 * Otherwise, analyze current directory (.)
 * Can be overridden with TARGET_DIR env var
 */
const getCurrentDir = () => process.cwd();
const isInActionDir = () => basename(getCurrentDir()) === '.ai-readiness-action';
const TARGET_DIR = process.env.TARGET_DIR || (isInActionDir() ? '..' : '.');

// Log path resolution details on initialization
console.log('[file-utils] Path resolution initialized:');
console.log(`  - Current working directory: ${getCurrentDir()}`);
console.log(`  - Is in .ai-readiness-action dir: ${isInActionDir()}`);
console.log(`  - TARGET_DIR: ${TARGET_DIR}`);
console.log(`  - Resolved TARGET_DIR (absolute): ${resolve(TARGET_DIR)}`);

/**
 * Resolve path relative to target directory
 * @param {string} filePath - Relative path
 * @returns {string} - Resolved path
 */
function resolvePath(filePath) {
  const resolved = join(TARGET_DIR, filePath);
  return resolved;
}

/**
 * Check if a file exists and is a regular file (not a directory)
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  const resolvedPath = resolvePath(filePath);
  try {
    const stats = await stat(resolvedPath);
    const exists = stats.isFile();
    console.log(`[file-utils] fileExists("${filePath}") -> resolved: "${resolvedPath}" -> ${exists}`);
    return exists;
  } catch (error) {
    console.log(`[file-utils] fileExists("${filePath}") -> resolved: "${resolvedPath}" -> false (${error.code || error.message})`);
    return false;
  }
}

/**
 * Find files matching a glob pattern
 * @param {string} pattern - Glob pattern
 * @returns {Promise<string[]>} - Array of file paths
 */
export async function findFiles(pattern) {
  console.log(`[file-utils] findFiles("${pattern}") -> searching in cwd: "${resolve(TARGET_DIR)}"`);
  try {
    const files = await globPkg(pattern, {
      nodir: true,
      dot: true,
      cwd: TARGET_DIR,
    });
    console.log(`[file-utils] findFiles("${pattern}") -> found ${files.length} files: ${JSON.stringify(files)}`);
    return files;
  } catch (error) {
    console.log(`[file-utils] findFiles("${pattern}") -> error: ${error.message}`);
    return [];
  }
}

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object|null>} - Parsed JSON object or null if file doesn't exist
 * @throws {SyntaxError} - If JSON is invalid
 */
export async function readJsonFile(filePath) {
  const resolvedPath = resolvePath(filePath);
  console.log(`[file-utils] readJsonFile("${filePath}") -> resolved: "${resolvedPath}"`);
  try {
    const content = await readFile(resolvedPath, 'utf-8');
    const parsed = JSON.parse(content);
    console.log(`[file-utils] readJsonFile("${filePath}") -> success`);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`[file-utils] readJsonFile("${filePath}") -> file not found`);
      return null;
    }
    console.log(`[file-utils] readJsonFile("${filePath}") -> error: ${error.message}`);
    throw error;
  }
}

/**
 * Read and parse an XML file
 * @param {string} filePath - Path to XML file
 * @returns {Promise<Object|null>} - Parsed XML object or null if file doesn't exist
 * @throws {Error} - If XML is invalid
 */
export async function readXmlFile(filePath) {
  try {
    const content = await readFile(resolvePath(filePath), 'utf-8');
    return await parseStringPromise(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Read file content as a string
 * @param {string} filePath - Path to file
 * @returns {Promise<string|null>} - File content or null if file doesn't exist
 */
export async function readFileContent(filePath) {
  try {
    return await readFile(resolvePath(filePath), 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
