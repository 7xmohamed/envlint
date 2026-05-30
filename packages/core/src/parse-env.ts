import type { EnvMap } from './types.js';

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parseEnvContent(content: string): EnvMap {
  const result: EnvMap = new Map();

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!ENV_KEY_PATTERN.test(key)) {
      continue;
    }

    const rawValue = line.slice(separatorIndex + 1).trim();
    result.set(key, parseValue(rawValue));
  }

  return result;
}

function parseValue(rawValue: string): string {
  if (isWrappedInDoubleQuotes(rawValue)) {
    return rawValue
      .slice(1, -1)
      .replace(/\\"/gu, '"')
      .replace(/\\n/gu, '\n');
  }

  if (isWrappedInSingleQuotes(rawValue)) {
    return rawValue.slice(1, -1);
  }

  return stripInlineComment(rawValue);
}

function stripInlineComment(value: string): string {
  const commentIndex = value.indexOf(' #');
  if (commentIndex === -1) {
    return value;
  }

  return value.slice(0, commentIndex).trimEnd();
}

function isWrappedInDoubleQuotes(value: string): boolean {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"');
}

function isWrappedInSingleQuotes(value: string): boolean {
  return value.length >= 2 && value.startsWith('\'') && value.endsWith('\'');
}
