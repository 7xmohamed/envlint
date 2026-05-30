import type { DiffResult, DiffStatus, EnvMap } from './types.js';

export interface NamedEnv {
  label: string;
  env: EnvMap;
}

export function diffEnvs(envs: NamedEnv[]): DiffResult {
  if (envs.length === 0) {
    return { labels: [], rows: [] };
  }

  const labels = envs.map((entry) => entry.label);
  const keys = collectAllKeys(envs.map((entry) => entry.env));
  const rows = keys
    .map((key) => ({
      key,
      statuses: envs.map((entry) => statusOf(entry.env, key))
    }))
    .filter((row) => !allSame(row.statuses))
    .sort((left, right) => left.key.localeCompare(right.key));

  return { labels, rows };
}

function statusOf(env: EnvMap, key: string): DiffStatus {
  if (!env.has(key)) {
    return 'missing';
  }

  return env.get(key) === '' ? 'empty' : 'present';
}

function collectAllKeys(envs: EnvMap[]): string[] {
  const keys = new Set<string>();

  for (const env of envs) {
    for (const key of env.keys()) {
      keys.add(key);
    }
  }

  return [...keys];
}

function allSame(values: DiffStatus[]): boolean {
  return values.every((value) => value === values[0]);
}
