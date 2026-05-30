'use strict';

/**
 * Parses a .env.schema file into a structured schema definition.
 *
 * Schema file format (each non-blank, non-comment line declares one variable):
 *
 *   VAR_NAME [options]
 *
 * Options (space-separated, order does not matter):
 *   required          - variable must be present and non-empty
 *   optional          - variable may be absent (this is the default)
 *   default=<value>   - fallback value when variable is absent
 *   type=string       - value must be a non-empty string (default)
 *   type=number       - value must be a valid finite number
 *   type=boolean      - value must be: true, false, 1, 0, yes, no
 *   type=url          - value must be a parseable URL (http or https)
 *   type=port         - value must be an integer between 1 and 65535
 *   desc=<text>       - human-readable description (rest of the line after desc=)
 *
 * Example:
 *   DATABASE_URL required type=url desc=PostgreSQL connection string
 *   PORT optional default=3000 type=port
 *   NODE_ENV required type=string
 *   ENABLE_CACHE optional type=boolean default=false
 *
 * @param {string} content - raw schema file content
 * @returns {Map<string, SchemaEntry>}
 *
 * @typedef {Object} SchemaEntry
 * @property {string} name
 * @property {boolean} required
 * @property {string|null} defaultValue
 * @property {'string'|'number'|'boolean'|'url'|'port'} type
 * @property {string} description
 */
function parseSchemaContent(content) {
  const schema = new Map();
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const entry = parseSchemaLine(line);
    if (entry !== null) {
      schema.set(entry.name, entry);
    }
  }

  return schema;
}

/**
 * Parses a single schema line into a SchemaEntry.
 *
 * @param {string} line
 * @returns {SchemaEntry|null}
 */
function parseSchemaLine(line) {
  const tokens = tokenizeSchemeLine(line);
  if (tokens.length === 0) {
    return null;
  }

  const name = tokens[0];
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return null;
  }

  const entry = {
    name,
    required: false,
    defaultValue: null,
    type: 'string',
    description: '',
  };

  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === 'required') {
      entry.required = true;
    } else if (token === 'optional') {
      entry.required = false;
    } else if (token.startsWith('default=')) {
      entry.defaultValue = token.slice('default='.length);
    } else if (token.startsWith('type=')) {
      const t = token.slice('type='.length);
      if (['string', 'number', 'boolean', 'url', 'port'].includes(t)) {
        entry.type = t;
      }
    } else if (token.startsWith('desc=')) {
      // desc= consumes everything to the end of the tokens
      entry.description = tokens.slice(i).join(' ').slice('desc='.length);
      break;
    }

    i++;
  }

  return entry;
}

/**
 * Tokenizes a schema line by whitespace, treating the schema name
 * and each option as a token. The desc= option is special: it captures
 * everything after it including spaces.
 *
 * @param {string} line
 * @returns {string[]}
 */
function tokenizeSchemeLine(line) {
  return line.split(/\s+/).filter(t => t.length > 0);
}

module.exports = { parseSchemaContent };
