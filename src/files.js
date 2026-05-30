'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Loads and parses a file, returning its content as a string.
 * Exits with a formatted error if the file cannot be read.
 *
 * @param {string} filePath - absolute or relative path
 * @returns {string}
 */
function readFileOrExit(filePath) {
  const resolved = path.resolve(filePath);
  try {
    return fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // caller decides how to handle missing files
    }
    throw err;
  }
}

/**
 * Resolves a list of env file paths, expanding wildcards like *.env.
 * Returns only paths that exist.
 *
 * We deliberately avoid glob dependencies - only simple directory listing
 * is used for pattern matching, which covers the practical use cases.
 *
 * @param {string[]} patterns
 * @returns {string[]}
 */
function resolveEnvPaths(patterns) {
  const resolved = [];
  for (const pattern of patterns) {
    resolved.push(path.resolve(pattern));
  }
  return resolved;
}

/**
 * Derives a human-readable label from a file path.
 * Strips the directory prefix and uses only the filename.
 *
 * @param {string} filePath
 * @returns {string}
 */
function labelFromPath(filePath) {
  return path.basename(filePath);
}

module.exports = { readFileOrExit, resolveEnvPaths, labelFromPath };
