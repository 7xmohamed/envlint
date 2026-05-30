'use strict';

/**
 * Self-contained test runner.
 *
 * No dependencies. Uses Node.js assert module.
 * Run with: node test/test.js
 *
 * Exit code 0: all tests pass
 * Exit code 1: one or more tests fail
 */

const assert = require('assert');
const { parseEnvContent } = require('../src/parse');
const { parseSchemaContent } = require('../src/schema');
const { validate } = require('../src/validate');
const { diffEnvs } = require('../src/diff');
const { generateSchema } = require('../src/init');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  pass  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

// ---- parse.js tests --------------------------------------------------------

console.log('\nparse.js');

test('parses a simple KEY=value pair', () => {
  const result = parseEnvContent('FOO=bar');
  assert.strictEqual(result.get('FOO'), 'bar');
});

test('parses double-quoted values', () => {
  const result = parseEnvContent('FOO="hello world"');
  assert.strictEqual(result.get('FOO'), 'hello world');
});

test('parses single-quoted values', () => {
  const result = parseEnvContent("FOO='hello world'");
  assert.strictEqual(result.get('FOO'), 'hello world');
});

test('skips comment lines', () => {
  const result = parseEnvContent('# this is a comment\nFOO=bar');
  assert.strictEqual(result.size, 1);
  assert.strictEqual(result.get('FOO'), 'bar');
});

test('skips blank lines', () => {
  const result = parseEnvContent('\n\nFOO=bar\n\n');
  assert.strictEqual(result.size, 1);
});

test('strips inline comments from bare values', () => {
  const result = parseEnvContent('FOO=bar # this is inline comment');
  assert.strictEqual(result.get('FOO'), 'bar');
});

test('handles empty value', () => {
  const result = parseEnvContent('FOO=');
  assert.strictEqual(result.get('FOO'), '');
});

test('handles multiple variables', () => {
  const content = 'A=1\nB=2\nC=3';
  const result = parseEnvContent(content);
  assert.strictEqual(result.size, 3);
  assert.strictEqual(result.get('A'), '1');
  assert.strictEqual(result.get('B'), '2');
  assert.strictEqual(result.get('C'), '3');
});

test('handles = in value', () => {
  const result = parseEnvContent('FOO=a=b=c');
  assert.strictEqual(result.get('FOO'), 'a=b=c');
});

test('handles escaped newline in double-quoted value', () => {
  const result = parseEnvContent('FOO="line1\\nline2"');
  assert.strictEqual(result.get('FOO'), 'line1\nline2');
});

// ---- schema.js tests -------------------------------------------------------

console.log('\nschema.js');

test('parses a required variable', () => {
  const schema = parseSchemaContent('DATABASE_URL required type=url');
  assert.ok(schema.has('DATABASE_URL'));
  assert.strictEqual(schema.get('DATABASE_URL').required, true);
  assert.strictEqual(schema.get('DATABASE_URL').type, 'url');
});

test('parses an optional variable with default', () => {
  const schema = parseSchemaContent('PORT optional type=port default=3000');
  const entry = schema.get('PORT');
  assert.ok(entry);
  assert.strictEqual(entry.required, false);
  assert.strictEqual(entry.defaultValue, '3000');
  assert.strictEqual(entry.type, 'port');
});

test('defaults to optional when neither required nor optional is specified', () => {
  const schema = parseSchemaContent('FOO type=string');
  assert.strictEqual(schema.get('FOO').required, false);
});

test('parses description', () => {
  const schema = parseSchemaContent('API_KEY required type=string desc=Third party API key');
  const entry = schema.get('API_KEY');
  assert.ok(entry.description.includes('Third party API key'));
});

test('skips comment lines', () => {
  const schema = parseSchemaContent('# this is a comment\nFOO required');
  assert.strictEqual(schema.size, 1);
});

test('parses multiple entries', () => {
  const content = 'A required type=string\nB optional type=number\nC required type=boolean';
  const schema = parseSchemaContent(content);
  assert.strictEqual(schema.size, 3);
});

// ---- validate.js tests -----------------------------------------------------

console.log('\nvalidate.js');

test('passes when all required vars are present', () => {
  const env = parseEnvContent('DATABASE_URL=http://localhost/db\nPORT=5432');
  const schema = parseSchemaContent('DATABASE_URL required type=url\nPORT required type=port');
  const errors = validate(env, schema);
  assert.strictEqual(errors.filter(e => e.level === 'error').length, 0);
});

test('errors when required var is missing', () => {
  const env = parseEnvContent('PORT=3000');
  const schema = parseSchemaContent('DATABASE_URL required type=url\nPORT required type=port');
  const errors = validate(env, schema);
  const missingErrors = errors.filter(e => e.rule === 'required-missing');
  assert.strictEqual(missingErrors.length, 1);
  assert.strictEqual(missingErrors[0].key, 'DATABASE_URL');
});

test('errors when required var is empty', () => {
  const env = parseEnvContent('DATABASE_URL=');
  const schema = parseSchemaContent('DATABASE_URL required type=string');
  const errors = validate(env, schema);
  assert.ok(errors.some(e => e.rule === 'required-missing'));
});

test('allows optional var to be absent', () => {
  const env = parseEnvContent('');
  const schema = parseSchemaContent('DEBUG optional type=boolean');
  const errors = validate(env, schema);
  assert.ok(!errors.some(e => e.level === 'error'));
});

test('uses default value to satisfy required check', () => {
  const env = parseEnvContent('');
  const schema = parseSchemaContent('PORT optional type=port default=3000');
  const errors = validate(env, schema);
  assert.ok(!errors.some(e => e.level === 'error'));
});

test('validates number type', () => {
  const env = parseEnvContent('TIMEOUT=notanumber');
  const schema = parseSchemaContent('TIMEOUT required type=number');
  const errors = validate(env, schema);
  assert.ok(errors.some(e => e.rule === 'type-number'));
});

test('passes valid number', () => {
  const env = parseEnvContent('TIMEOUT=30');
  const schema = parseSchemaContent('TIMEOUT required type=number');
  const errors = validate(env, schema);
  assert.ok(!errors.some(e => e.rule === 'type-number'));
});

test('validates boolean type', () => {
  const env = parseEnvContent('CACHE=enabled');
  const schema = parseSchemaContent('CACHE required type=boolean');
  const errors = validate(env, schema);
  assert.ok(errors.some(e => e.rule === 'type-boolean'));
});

test('passes valid boolean values', () => {
  const validBooleans = ['true', 'false', '1', '0', 'yes', 'no'];
  for (const val of validBooleans) {
    const env = parseEnvContent(`CACHE=${val}`);
    const schema = parseSchemaContent('CACHE required type=boolean');
    const errors = validate(env, schema);
    assert.ok(!errors.some(e => e.rule === 'type-boolean'), `Expected ${val} to be valid boolean`);
  }
});

test('validates url type', () => {
  const env = parseEnvContent('API_URL=not-a-url');
  const schema = parseSchemaContent('API_URL required type=url');
  const errors = validate(env, schema);
  assert.ok(errors.some(e => e.rule === 'type-url'));
});

test('rejects non-http URL', () => {
  const env = parseEnvContent('API_URL=ftp://example.com');
  const schema = parseSchemaContent('API_URL required type=url');
  const errors = validate(env, schema);
  assert.ok(errors.some(e => e.rule === 'type-url'));
});

test('passes valid https URL', () => {
  const env = parseEnvContent('API_URL=https://api.example.com/v1');
  const schema = parseSchemaContent('API_URL required type=url');
  const errors = validate(env, schema);
  assert.ok(!errors.some(e => e.rule === 'type-url'));
});

test('validates port type - rejects 0', () => {
  const env = parseEnvContent('PORT=0');
  const schema = parseSchemaContent('PORT required type=port');
  const errors = validate(env, schema);
  assert.ok(errors.some(e => e.rule === 'type-port'));
});

test('validates port type - rejects 99999', () => {
  const env = parseEnvContent('PORT=99999');
  const schema = parseSchemaContent('PORT required type=port');
  const errors = validate(env, schema);
  assert.ok(errors.some(e => e.rule === 'type-port'));
});

test('passes valid port', () => {
  const env = parseEnvContent('PORT=3000');
  const schema = parseSchemaContent('PORT required type=port');
  const errors = validate(env, schema);
  assert.ok(!errors.some(e => e.rule === 'type-port'));
});

test('warns about undeclared variables by default', () => {
  const env = parseEnvContent('FOO=bar\nSECRET_UNDECLARED=xyz');
  const schema = parseSchemaContent('FOO required type=string');
  const errors = validate(env, schema);
  const undeclared = errors.filter(e => e.rule === 'undeclared-variable');
  assert.ok(undeclared.length > 0);
  assert.strictEqual(undeclared[0].level, 'warning');
});

test('errors about undeclared variables in strict mode', () => {
  const env = parseEnvContent('FOO=bar\nSECRET_UNDECLARED=xyz');
  const schema = parseSchemaContent('FOO required type=string');
  const errors = validate(env, schema, { strict: true });
  const undeclared = errors.filter(e => e.rule === 'undeclared-variable');
  assert.strictEqual(undeclared[0].level, 'error');
});

// ---- diff.js tests ---------------------------------------------------------

console.log('\ndiff.js');

test('returns no rows when all envs have the same keys', () => {
  const a = parseEnvContent('FOO=1\nBAR=2');
  const b = parseEnvContent('FOO=3\nBAR=4');
  const result = diffEnvs([
    { label: 'a', env: a },
    { label: 'b', env: b },
  ]);
  assert.strictEqual(result.rows.length, 0);
});

test('reports keys missing in one env', () => {
  const a = parseEnvContent('FOO=1\nBAR=2');
  const b = parseEnvContent('FOO=3');
  const result = diffEnvs([
    { label: 'a', env: a },
    { label: 'b', env: b },
  ]);
  const barRow = result.rows.find(r => r.key === 'BAR');
  assert.ok(barRow);
  assert.strictEqual(barRow.statuses[0], 'present');
  assert.strictEqual(barRow.statuses[1], 'missing');
});

test('reports empty values', () => {
  const a = parseEnvContent('FOO=');
  const b = parseEnvContent('FOO=bar');
  const result = diffEnvs([
    { label: 'a', env: a },
    { label: 'b', env: b },
  ]);
  assert.strictEqual(result.rows[0].statuses[0], 'empty');
  assert.strictEqual(result.rows[0].statuses[1], 'present');
});

test('handles three-way diff', () => {
  const a = parseEnvContent('FOO=1\nBAR=2\nBAZ=3');
  const b = parseEnvContent('FOO=1\nBAR=2');
  const c = parseEnvContent('FOO=1');
  const result = diffEnvs([
    { label: 'a', env: a },
    { label: 'b', env: b },
    { label: 'c', env: c },
  ]);
  assert.ok(result.rows.find(r => r.key === 'BAZ'));
  assert.ok(result.rows.find(r => r.key === 'BAR'));
});

test('does not expose values in diff', () => {
  const a = parseEnvContent('SECRET=very_sensitive_password');
  const b = parseEnvContent('OTHER=something');
  const result = diffEnvs([
    { label: 'a', env: a },
    { label: 'b', env: b },
  ]);
  // The DiffResult contains only 'present'|'missing'|'empty' statuses
  for (const row of result.rows) {
    for (const status of row.statuses) {
      assert.ok(['present', 'missing', 'empty'].includes(status));
    }
  }
});

// ---- init.js tests ---------------------------------------------------------

console.log('\ninit.js');

test('generates schema entries for each key', () => {
  const env = parseEnvContent('FOO=bar\nPORT=3000\nDEBUG=true');
  const schema = generateSchema(env);
  assert.ok(schema.includes('FOO'));
  assert.ok(schema.includes('PORT'));
  assert.ok(schema.includes('DEBUG'));
});

test('infers port type', () => {
  const env = parseEnvContent('PORT=3000');
  const schema = generateSchema(env);
  assert.ok(schema.includes('type=port'));
});

test('infers boolean type', () => {
  const env = parseEnvContent('DEBUG=true');
  const schema = generateSchema(env);
  assert.ok(schema.includes('type=boolean'));
});

test('infers url type', () => {
  const env = parseEnvContent('API_URL=https://example.com');
  const schema = generateSchema(env);
  assert.ok(schema.includes('type=url'));
});

test('infers string type for non-numeric non-url values', () => {
  const env = parseEnvContent('SECRET_KEY=abc123xyz');
  const schema = generateSchema(env);
  assert.ok(schema.includes('type=string'));
});

test('generates parseable schema output', () => {
  const env = parseEnvContent('FOO=bar\nPORT=3000\nDEBUG=false\nAPI=https://x.com');
  const schemaText = generateSchema(env);
  const parsed = parseSchemaContent(schemaText);
  assert.strictEqual(parsed.size, 4);
});

// ---- Summary ---------------------------------------------------------------

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
