'use strict';

/**
 * Computes a key-level diff between two or more parsed env maps.
 *
 * The diff answers: "which keys differ between these environments, and how?"
 * Values are intentionally NOT exposed in the diff output to prevent
 * accidentally leaking secrets in logs or terminal output.
 *
 * @param {Array<{label: string, env: Map<string, string>}>} envs
 * @returns {DiffResult}
 *
 * @typedef {Object} DiffResult
 * @property {string[]} labels - ordered list of environment labels
 * @property {DiffRow[]} rows - one row per key that differs
 *
 * @typedef {Object} DiffRow
 * @property {string} key
 * @property {DiffStatus[]} statuses - one per env, same order as labels
 *
 * @typedef {'present'|'missing'|'empty'} DiffStatus
 */
function diffEnvs(envs) {
  if (envs.length === 0) {
    return { labels: [], rows: [] };
  }

  const allKeys = collectAllKeys(envs.map(e => e.env));
  const labels = envs.map(e => e.label);
  const rows = [];

  for (const key of allKeys) {
    const statuses = envs.map(e => statusOf(e.env, key));

    // Only include the key if it differs across at least one env pair.
    if (!allSame(statuses)) {
      rows.push({ key, statuses });
    }
  }

  rows.sort((a, b) => a.key.localeCompare(b.key));

  return { labels, rows };
}

/**
 * Determines the presence status of a key in a single env.
 *
 * @param {Map<string, string>} env
 * @param {string} key
 * @returns {DiffStatus}
 */
function statusOf(env, key) {
  if (!env.has(key)) {
    return 'missing';
  }
  if (env.get(key) === '') {
    return 'empty';
  }
  return 'present';
}

/**
 * Collects all unique keys from all env maps, sorted alphabetically.
 *
 * @param {Map<string, string>[]} envs
 * @returns {string[]}
 */
function collectAllKeys(envs) {
  const keys = new Set();
  for (const env of envs) {
    for (const key of env.keys()) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

/**
 * Returns true if all values in the array are identical.
 *
 * @param {string[]} values
 * @returns {boolean}
 */
function allSame(values) {
  return values.every(v => v === values[0]);
}

module.exports = { diffEnvs };
