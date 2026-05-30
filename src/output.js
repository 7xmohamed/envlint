'use strict';

/**
 * Terminal output formatting.
 *
 * All output goes through this module so that:
 * - color can be disabled via --no-color or NO_COLOR env var
 * - output format (text vs json) can be switched without touching other code
 *
 * Color support follows the NO_COLOR spec (https://no-color.org/) and is
 * automatically disabled when stdout is not a TTY (piped output, CI logs).
 */

const SUPPORTS_COLOR =
  process.stdout.isTTY &&
  !process.env.NO_COLOR &&
  process.env.TERM !== 'dumb';

const COLORS = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
};

/**
 * Wraps text in an ANSI color code if color is supported.
 *
 * @param {string} text
 * @param {keyof COLORS} color
 * @returns {string}
 */
function colorize(text, color) {
  if (!SUPPORTS_COLOR) {
    return text;
  }
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

/**
 * Formats validation results for a single env file.
 *
 * @param {string} filePath
 * @param {import('./validate').ValidationError[]} errors
 * @param {object} options
 * @param {boolean} [options.json] - output as JSON
 * @param {boolean} [options.quiet] - suppress output on success
 * @returns {string}
 */
function formatValidation(filePath, errors, options = {}) {
  if (options.json) {
    return JSON.stringify({ file: filePath, issues: errors }, null, 2);
  }

  const lines = [];
  const errorCount = errors.filter(e => e.level === 'error').length;
  const warnCount = errors.filter(e => e.level === 'warning').length;

  lines.push('');
  lines.push(colorize(`Validating: ${filePath}`, 'bold'));
  lines.push('');

  if (errors.length === 0) {
    if (!options.quiet) {
      lines.push(colorize('  No issues found.', 'green'));
    }
  } else {
    for (const err of errors) {
      const icon = err.level === 'error' ? colorize('error', 'red') : colorize('warn ', 'yellow');
      const key = colorize(err.key, 'bold');
      lines.push(`  ${icon}  ${key}  ${err.message}`);
    }
    lines.push('');

    const parts = [];
    if (errorCount > 0) {
      parts.push(colorize(`${errorCount} error${errorCount !== 1 ? 's' : ''}`, 'red'));
    }
    if (warnCount > 0) {
      parts.push(colorize(`${warnCount} warning${warnCount !== 1 ? 's' : ''}`, 'yellow'));
    }
    lines.push(`  Found ${parts.join(', ')}`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Formats a diff result between multiple env files.
 *
 * @param {import('./diff').DiffResult} diffResult
 * @param {object} options
 * @param {boolean} [options.json]
 * @returns {string}
 */
function formatDiff(diffResult, options = {}) {
  if (options.json) {
    return JSON.stringify(diffResult, null, 2);
  }

  const { labels, rows } = diffResult;
  const lines = [];

  lines.push('');
  lines.push(colorize('Environment diff (values hidden):', 'bold'));
  lines.push('');

  if (rows.length === 0) {
    lines.push(colorize('  All keys match across environments.', 'green'));
    lines.push('');
    return lines.join('\n');
  }

  // Build a table: key column + one column per env
  const KEY_COL_WIDTH = Math.max(
    'KEY'.length,
    ...rows.map(r => r.key.length)
  );
  const ENV_COL_WIDTH = Math.max(
    ...labels.map(l => l.length),
    'present'.length
  );

  const pad = (s, w) => s.padEnd(w, ' ');
  const headerKey = colorize(pad('KEY', KEY_COL_WIDTH), 'bold');
  const headerEnvs = labels.map(l => colorize(pad(l, ENV_COL_WIDTH), 'bold')).join('  ');
  lines.push(`  ${headerKey}  ${headerEnvs}`);

  const separator = `  ${'-'.repeat(KEY_COL_WIDTH)}  ${labels.map(() => '-'.repeat(ENV_COL_WIDTH)).join('  ')}`;
  lines.push(colorize(separator, 'dim'));

  for (const row of rows) {
    const keyCell = pad(row.key, KEY_COL_WIDTH);
    const statusCells = row.statuses.map(s => {
      const cell = pad(s, ENV_COL_WIDTH);
      if (s === 'present') return colorize(cell, 'green');
      if (s === 'empty')   return colorize(cell, 'yellow');
      return colorize(cell, 'red');
    });
    lines.push(`  ${keyCell}  ${statusCells.join('  ')}`);
  }

  lines.push('');
  lines.push(`  ${rows.length} key${rows.length !== 1 ? 's' : ''} differ`);
  lines.push('');
  return lines.join('\n');
}

/**
 * Formats a schema list (for --list-schema command).
 *
 * @param {Map<string, import('./schema').SchemaEntry>} schema
 * @param {object} options
 * @param {boolean} [options.json]
 * @returns {string}
 */
function formatSchema(schema, options = {}) {
  if (options.json) {
    const obj = Object.fromEntries(schema);
    return JSON.stringify(obj, null, 2);
  }

  const entries = [...schema.values()];
  if (entries.length === 0) {
    return '\n  Schema is empty.\n';
  }

  const lines = [];
  lines.push('');
  lines.push(colorize(`Schema (${entries.length} variable${entries.length !== 1 ? 's' : ''})`, 'bold'));
  lines.push('');

  for (const entry of entries) {
    const required = entry.required
      ? colorize('required', 'red')
      : colorize('optional', 'dim');
    const type = colorize(`type=${entry.type}`, 'cyan');
    const def = entry.defaultValue !== null
      ? colorize(`default=${entry.defaultValue}`, 'gray')
      : '';
    const desc = entry.description ? colorize(`  # ${entry.description}`, 'dim') : '';
    const parts = [required, type, def].filter(Boolean).join('  ');
    lines.push(`  ${colorize(entry.name, 'bold')}  ${parts}${desc}`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Formats a fatal error before exit.
 *
 * @param {string} message
 * @returns {string}
 */
function formatFatalError(message) {
  return `\n  ${colorize('error', 'red')}  ${message}\n`;
}

module.exports = { formatValidation, formatDiff, formatSchema, formatFatalError };
