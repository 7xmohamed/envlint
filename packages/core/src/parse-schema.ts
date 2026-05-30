import type { SchemaEntry, SchemaType } from './types.js';

const SCHEMA_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SUPPORTED_TYPES: ReadonlySet<SchemaType> = new Set([
  'string',
  'number',
  'boolean',
  'url',
  'port'
]);

export function parseSchemaContent(content: string): Map<string, SchemaEntry> {
  const schema = new Map<string, SchemaEntry>();

  for (const rawLine of content.split(/\r?\n/u)) {
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

export function parseSchemaLine(line: string): SchemaEntry | null {
  const tokens = tokenizeSchemaLine(line);
  if (tokens.length === 0) {
    return null;
  }

  const [name, ...options] = tokens;
  if (!name || !SCHEMA_KEY_PATTERN.test(name)) {
    return null;
  }

  const entry: SchemaEntry = {
    name,
    required: false,
    defaultValue: null,
    type: 'string',
    description: ''
  };

  for (let index = 0; index < options.length; index += 1) {
    const token = options[index];
    if (token === 'required') {
      entry.required = true;
      continue;
    }

    if (token === 'optional') {
      entry.required = false;
      continue;
    }

    if (token?.startsWith('default=')) {
      entry.defaultValue = token.slice('default='.length);
      continue;
    }

    if (token?.startsWith('type=')) {
      const candidate = token.slice('type='.length) as SchemaType;
      if (SUPPORTED_TYPES.has(candidate)) {
        entry.type = candidate;
      }
      continue;
    }

    if (token?.startsWith('desc=')) {
      entry.description = options.slice(index).join(' ').slice('desc='.length);
      break;
    }
  }

  return entry;
}

function tokenizeSchemaLine(line: string): string[] {
  return line.split(/\s+/u).filter(Boolean);
}
