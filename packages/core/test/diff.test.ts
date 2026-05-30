import { describe, expect, it } from 'vitest';
import { diffEnvs } from '../src/diff.js';
import { parseEnvContent } from '../src/parse-env.js';

describe('diffEnvs', () => {
  it('returns only differing keys', () => {
    const result = diffEnvs([
      { label: 'a', env: parseEnvContent('FOO=1\nBAR=') },
      { label: 'b', env: parseEnvContent('FOO=2') }
    ]);

    expect(result.rows).toEqual([
      {
        key: 'BAR',
        statuses: ['empty', 'missing']
      }
    ]);
  });
});
