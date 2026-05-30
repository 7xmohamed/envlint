'use strict';

/**
 * Parses a .env file into a flat map of key -> value.
 *
 * Handles:
 * - KEY=value
 * - KEY="quoted value"
 * - KEY='single quoted'
 * - # comment lines
 * - blank lines
 * - inline comments after value (KEY=val # comment)
 * - multiline values enclosed in quotes are NOT supported - this is intentional;
 *   multiline .env files are a footgun and tooling support is inconsistent.
 *
 * @param {string} content - raw file content
 * @returns {Map<string, string>} parsed key-value pairs
 */
function parseEnvContent(content) {
  const result = new Map();
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      // Lines without = are invalid in .env format; skip silently.
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    if (key === '' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    const rawValue = line.slice(eqIndex + 1);
    const value = stripInlineComment(unquote(rawValue.trim()));
    result.set(key, value);
  }

  return result;
}

/**
 * Removes surrounding quotes from a value, handling escaped characters
 * inside double-quoted strings.
 *
 * @param {string} value
 * @returns {string}
 */
function unquote(value) {
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Strips a trailing inline comment (# ...) from an unquoted value.
 * Only applies to bare (unquoted) values - quoted values are handled
 * before reaching this function.
 *
 * @param {string} value
 * @returns {string}
 */
function stripInlineComment(value) {
  const commentIndex = value.indexOf(' #');
  if (commentIndex !== -1) {
    return value.slice(0, commentIndex).trimEnd();
  }
  return value;
}

module.exports = { parseEnvContent };
