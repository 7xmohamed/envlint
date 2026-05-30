import { describe, expect, it } from 'vitest';
import { generateSchema, inferType } from '../src/generate-schema.js';
import { parseEnvContent } from '../src/parse-env.js';

describe('generateSchema', () => {
  it('infers port only for port-like keys', () => {
    expect(inferType('PORT', '3000')).toBe('port');
    expect(inferType('ACCOUNT_ID', '3000')).toBe('number');
  });

  it('produces parseable schema text', () => {
    const schema = generateSchema(parseEnvContent('PORT=3000\nDEBUG=true'));
    expect(schema).toContain('PORT required type=port');
    expect(schema).toContain('DEBUG required type=boolean');
  });
});
