import { describe, expect, it } from 'vitest';
import { parseEnvContent } from '../src/parse-env.js';

describe('parseEnvContent', () => {
  it('parses quoted values with spaces', () => {
    expect(parseEnvContent('FOO="hello world"').get('FOO')).toBe('hello world');
  });

  it('preserves inline hash inside quoted values', () => {
    expect(parseEnvContent('FOO="abc # not comment"').get('FOO')).toBe('abc # not comment');
  });

  it('strips inline comments from bare values', () => {
    expect(parseEnvContent('FOO=bar # comment').get('FOO')).toBe('bar');
  });

  it('skips invalid keys and comment lines', () => {
    const parsed = parseEnvContent('# comment\n1BAD=value\nGOOD=value');
    expect(parsed.size).toBe(1);
    expect(parsed.get('GOOD')).toBe('value');
  });
});
