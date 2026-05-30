import type { EnvMap, SchemaEntry, SchemaType, ValidationIssue } from './types.js';

export interface ValidateOptions {
  strict?: boolean;
}

export function validate(
  env: EnvMap,
  schema: Map<string, SchemaEntry>,
  options: ValidateOptions = {}
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const strict = options.strict ?? false;

  for (const [name, entry] of schema) {
    const rawValue = env.get(name);
    const effectiveValue = rawValue ?? entry.defaultValue;

    if (entry.required && (effectiveValue === null || effectiveValue === '')) {
      issues.push({
        level: 'error',
        key: name,
        message: 'required variable is missing or empty',
        rule: 'required-missing'
      });
      continue;
    }

    if (effectiveValue !== null && effectiveValue !== '') {
      const typeIssue = checkType(name, effectiveValue, entry.type);
      if (typeIssue !== null) {
        issues.push(typeIssue);
      }
    }
  }

  for (const key of env.keys()) {
    if (schema.has(key)) {
      continue;
    }

    issues.push({
      level: strict ? 'error' : 'warning',
      key,
      message: 'variable is not declared in schema',
      rule: 'undeclared-variable'
    });
  }

  return issues;
}

function checkType(key: string, value: string, type: SchemaType): ValidationIssue | null {
  switch (type) {
    case 'number':
      return checkNumber(key, value);
    case 'boolean':
      return checkBoolean(key, value);
    case 'url':
      return checkUrl(key, value);
    case 'port':
      return checkPort(key, value);
    case 'string':
    default:
      return null;
  }
}

function checkNumber(key: string, value: string): ValidationIssue | null {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return null;
  }

  return {
    level: 'error',
    key,
    message: `expected a valid number, got "${value}"`,
    rule: 'type-number'
  };
}

function checkBoolean(key: string, value: string): ValidationIssue | null {
  const normalized = value.toLowerCase();
  if (['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)) {
    return null;
  }

  return {
    level: 'error',
    key,
    message: `expected a boolean (true/false/1/0/yes/no), got "${value}"`,
    rule: 'type-boolean'
  };
}

function checkUrl(key: string, value: string): ValidationIssue | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return null;
    }

    return {
      level: 'error',
      key,
      message: `expected an http/https URL, got protocol "${parsed.protocol}"`,
      rule: 'type-url'
    };
  } catch {
    return {
      level: 'error',
      key,
      message: `expected a valid URL, got "${value}"`,
      rule: 'type-url'
    };
  }
}

function checkPort(key: string, value: string): ValidationIssue | null {
  const numericValue = Number(value);
  if (Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 65535) {
    return null;
  }

  return {
    level: 'error',
    key,
    message: `expected a port number (1-65535), got "${value}"`,
    rule: 'type-port'
  };
}
