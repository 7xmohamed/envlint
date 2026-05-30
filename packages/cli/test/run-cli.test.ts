import { describe, expect, it } from 'vitest';
import { runCli } from '../src/run-cli.js';
import type { FileSystem } from '../src/filesystem.js';

function createFileSystem(files: Record<string, string>): FileSystem {
  const store = new Map(Object.entries(files));

  return {
    exists(filePath) {
      return store.has(filePath);
    },
    readText(filePath) {
      return store.get(filePath) ?? null;
    },
    writeText(filePath, content) {
      store.set(filePath, content);
    },
    resolve(filePath) {
      return filePath;
    },
    basename(filePath) {
      return filePath.split('/').pop() ?? filePath;
    }
  };
}

describe('runCli', () => {
  it('returns fatal usage errors for unknown flags', () => {
    const result = runCli(['check', '--bad-flag']);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Unknown option');
  });

  it('validates env content against schema', () => {
    const result = runCli(['check'], {
      fs: createFileSystem({
        '.env': 'PORT=3000',
        '.env.schema': 'PORT required type=port'
      })
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No issues found.');
  });

  it('suppresses all success output in quiet mode', () => {
    const result = runCli(['check', '--quiet'], {
      fs: createFileSystem({
        '.env': 'PORT=3000',
        '.env.schema': 'PORT required type=port'
      })
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
  });

  it('writes generated schema content', () => {
    const fs = createFileSystem({
      '.env': 'PORT=3000'
    });

    const result = runCli(['init'], { fs });
    expect(result.exitCode).toBe(0);
    expect(fs.readText('.env.schema')).toContain('PORT required type=port');
  });
});
