import { describe, expect, it } from 'vitest';
import { parseEnvContent } from '../src/parse-env.js';
import { parseSchemaContent } from '../src/parse-schema.js';
import { validate } from '../src/validate.js';

describe('validate', () => {
  it('reports missing required variables', () => {
    const env = parseEnvContent('PORT=3000');
    const schema = parseSchemaContent('DATABASE_URL required type=url\nPORT required type=port');
    expect(validate(env, schema)).toContainEqual({
      level: 'error',
      key: 'DATABASE_URL',
      message: 'required variable is missing or empty',
      rule: 'required-missing'
    });
  });

  it('treats undeclared variables as warnings by default', () => {
    const env = parseEnvContent('EXTRA=value');
    const schema = parseSchemaContent('');
    expect(validate(env, schema)).toContainEqual({
      level: 'warning',
      key: 'EXTRA',
      message: 'variable is not declared in schema',
      rule: 'undeclared-variable'
    });
  });

  it('treats undeclared variables as errors in strict mode', () => {
    const env = parseEnvContent('EXTRA=value');
    const schema = parseSchemaContent('');
    expect(validate(env, schema, { strict: true })[0]?.level).toBe('error');
  });
});
