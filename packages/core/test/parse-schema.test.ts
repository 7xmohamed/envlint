import { describe, expect, it } from 'vitest';
import { parseSchemaContent } from '../src/parse-schema.js';

describe('parseSchemaContent', () => {
  it('parses required entries and descriptions', () => {
    const schema = parseSchemaContent('API_KEY required type=string desc=Main API key');
    expect(schema.get('API_KEY')).toEqual({
      name: 'API_KEY',
      required: true,
      defaultValue: null,
      type: 'string',
      description: 'Main API key'
    });
  });

  it('ignores invalid lines', () => {
    const schema = parseSchemaContent('# comment\n1BAD required\nPORT optional type=port');
    expect(schema.size).toBe(1);
    expect(schema.get('PORT')?.type).toBe('port');
  });
});
