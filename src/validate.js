'use strict';

/**
 * Validates a parsed .env map against a parsed schema.
 *
 * Returns a list of ValidationError objects, one per problem found.
 * An empty array means the env passes the schema.
 *
 * Checks performed (in order):
 * 1. Required variables that are absent or empty
 * 2. Type validation for all present variables that have a schema entry
 * 3. Variables present in env but absent from schema (undeclared vars)
 *    - reported as warnings, not errors, unless --strict is set
 *
 * @param {Map<string, string>} env - parsed .env content
 * @param {Map<string, import('./schema').SchemaEntry>} schema
 * @param {object} options
 * @param {boolean} [options.strict] - treat undeclared vars as errors
 * @returns {ValidationError[]}
 *
 * @typedef {Object} ValidationError
 * @property {'error'|'warning'} level
 * @property {string} key
 * @property {string} message
 * @property {string} rule - machine-readable rule identifier
 */
function validate(env, schema, options = {}) {
  const errors = [];
  const { strict = false } = options;

  for (const [name, entry] of schema) {
    const rawValue = env.get(name);
    const effectiveValue = rawValue !== undefined ? rawValue : entry.defaultValue;

    if (entry.required && (effectiveValue === null || effectiveValue === undefined || effectiveValue === '')) {
      errors.push({
        level: 'error',
        key: name,
        message: `required variable is missing or empty`,
        rule: 'required-missing',
      });
      continue;
    }

    if (effectiveValue !== null && effectiveValue !== undefined && effectiveValue !== '') {
      const typeError = checkType(name, effectiveValue, entry.type);
      if (typeError !== null) {
        errors.push(typeError);
      }
    }
  }

  for (const key of env.keys()) {
    if (!schema.has(key)) {
      errors.push({
        level: strict ? 'error' : 'warning',
        key,
        message: `variable is not declared in schema`,
        rule: 'undeclared-variable',
      });
    }
  }

  return errors;
}

/**
 * Checks whether a value satisfies the declared type constraint.
 *
 * @param {string} key
 * @param {string} value
 * @param {string} type
 * @returns {ValidationError|null}
 */
function checkType(key, value, type) {
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

function checkNumber(key, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return {
      level: 'error',
      key,
      message: `expected a valid number, got "${value}"`,
      rule: 'type-number',
    };
  }
  return null;
}

function checkBoolean(key, value) {
  const valid = ['true', 'false', '1', '0', 'yes', 'no'];
  if (!valid.includes(value.toLowerCase())) {
    return {
      level: 'error',
      key,
      message: `expected a boolean (true/false/1/0/yes/no), got "${value}"`,
      rule: 'type-boolean',
    };
  }
  return null;
}

function checkUrl(key, value) {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        level: 'error',
        key,
        message: `expected an http/https URL, got protocol "${parsed.protocol}"`,
        rule: 'type-url',
      };
    }
  } catch {
    return {
      level: 'error',
      key,
      message: `expected a valid URL, got "${value}"`,
      rule: 'type-url',
    };
  }
  return null;
}

function checkPort(key, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return {
      level: 'error',
      key,
      message: `expected a port number (1-65535), got "${value}"`,
      rule: 'type-port',
    };
  }
  return null;
}

module.exports = { validate };
