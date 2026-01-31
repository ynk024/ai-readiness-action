import { access, readFile, stat } from 'fs/promises';
import { constants } from 'fs';
import { glob as globPkg } from 'glob';
import { parseStringPromise } from 'xml2js';
import { join, basename } from 'path';

/**
 * Get the target directory to analyze
 * If we're in .ai-readiness-action, analyze parent directory (..)
 * Otherwise, analyze current directory (.)
 * Can be overridden with TARGET_DIR env var
 */
const getCurrentDir = () => process.cwd();
const isInActionDir = () => basename(getCurrentDir()) === '.ai-readiness-action';
const TARGET_DIR = process.env.TARGET_DIR || (isInActionDir() ? '..' : '.');

/**
 * Resolve path relative to target directory
 * @param {string} filePath - Relative path
 * @returns {string} - Resolved path
 */
function resolvePath(filePath) {
  return join(TARGET_DIR, filePath);
}

/**
 * Check if a file exists and is a regular file (not a directory)
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    const stats = await stat(resolvePath(filePath));
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Find files matching a glob pattern
 * @param {string} pattern - Glob pattern
 * @returns {Promise<string[]>} - Array of file paths
 */
export async function findFiles(pattern) {
  try {
    const files = await globPkg(pattern, {
      nodir: true,
      dot: true,
      cwd: TARGET_DIR,
    });
    return files;
  } catch (error) {
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
  try {
    const content = await readFile(resolvePath(filePath), 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
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
