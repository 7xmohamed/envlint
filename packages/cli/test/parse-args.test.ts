import { describe, expect, it } from 'vitest';
import { CliUsageError } from '../src/errors.js';
import { parseArgs } from '../src/parse-args.js';

describe('parseArgs', () => {
  it('defaults to help for empty input', () => {
    expect(parseArgs([]).command).toBe('help');
  });

  it('parses no-color and schema options', () => {
    expect(parseArgs(['check', '.env', '--schema', 'custom.schema', '--no-color'])).toMatchObject({
      command: 'check',
      files: ['.env'],
      schemaPath: 'custom.schema',
      noColor: true
    });
  });

  it('throws on unknown flags', () => {
    expect(() => parseArgs(['check', '--strcit'])).toThrowError(CliUsageError);
  });

  it('throws when an option value is missing', () => {
    expect(() => parseArgs(['check', '--schema'])).toThrowError(CliUsageError);
  });
});
