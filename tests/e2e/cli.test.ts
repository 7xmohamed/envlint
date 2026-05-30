import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const tempDirectories: string[] = [];
const repoRoot = path.resolve(__dirname, '..', '..');
const cliEntry = path.resolve('packages/cli/dist/main.cjs');

beforeAll(() => {
  runBuild();
}, 30000);

function runBuild(): void {
  if (process.platform === 'win32') {
    execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'pnpm build'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return;
  }

  execFileSync('pnpm', ['build'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
}

function createTempDir(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'envlint-'));
  tempDirectories.push(directory);
  return directory;
}

function runCli(args: string[], cwd: string): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync(process.execPath, [cliEntry, ...args], {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        NO_COLOR: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return { stdout, stderr: '', status: 0 };
  } catch (error) {
    const childError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };

    return {
      stdout: childError.stdout ?? '',
      stderr: childError.stderr ?? '',
      status: childError.status ?? 1
    };
  }
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('envlint CLI', () => {
  it('reports success for a valid env file', () => {
    const directory = createTempDir();
    writeFileSync(path.join(directory, '.env'), 'PORT=3000\n');
    writeFileSync(path.join(directory, '.env.schema'), 'PORT required type=port\n');

    const result = runCli(['check'], directory);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('No issues found.');
  });

  it('fails on malformed arguments', () => {
    const directory = createTempDir();
    const result = runCli(['check', '--schema'], directory);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('requires a value');
  });

  it('prints nothing on quiet success', () => {
    const directory = createTempDir();
    writeFileSync(path.join(directory, '.env'), 'PORT=3000\n');
    writeFileSync(path.join(directory, '.env.schema'), 'PORT required type=port\n');

    const result = runCli(['check', '--quiet'], directory);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it('does not print raw values in diff output', () => {
    const directory = createTempDir();
    writeFileSync(path.join(directory, '.env'), 'SECRET=super-secret\n');
    writeFileSync(path.join(directory, '.env.prod'), 'OTHER=value\n');

    const result = runCli(['diff', '.env', '.env.prod'], directory);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('SECRET');
    expect(result.stdout).not.toContain('super-secret');
  });

  it('generates a schema file', () => {
    const directory = createTempDir();
    writeFileSync(path.join(directory, '.env'), 'PORT=3000\nDEBUG=true\n');

    const result = runCli(['init'], directory);
    expect(result.status).toBe(0);
    expect(readFileSync(path.join(directory, '.env.schema'), 'utf8')).toContain('DEBUG required type=boolean');
  });
});
