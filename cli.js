#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { parseArgs } = require('./src/args');
const { parseEnvContent } = require('./src/parse');
const { parseSchemaContent } = require('./src/schema');
const { validate } = require('./src/validate');
const { diffEnvs } = require('./src/diff');
const { generateSchema } = require('./src/init');
const { readFileOrExit, labelFromPath } = require('./src/files');
const {
  formatValidation,
  formatDiff,
  formatSchema,
  formatFatalError,
} = require('./src/output');

const HELP_TEXT = `
envlint - environment variable linter

Usage:
  envlint check [<file>] [options]
  envlint diff <file1> <file2> [<file3>...] [options]
  envlint schema [options]
  envlint init [options]
  envlint help

Commands:
  check     Validate a .env file against a schema (default command)
  diff      Compare keys across multiple .env files (values are hidden)
  schema    Display the parsed schema
  init      Generate a starter .env.schema from an existing .env file

Options:
  --schema, -s <path>    Schema file path (default: .env.schema)
  --strict               Treat undeclared variables as errors
  --json                 Output results as JSON
  --quiet, -q            Suppress output when no issues found
  --from <path>          Source .env for init (default: .env)
  --out <path>           Output path for init (default: .env.schema)
  --help, -h             Show this help

Examples:
  envlint check                          Validate .env against .env.schema
  envlint check .env.staging             Validate a specific file
  envlint check .env --strict            Fail on undeclared variables
  envlint diff .env .env.staging         Key-only diff, values hidden
  envlint diff .env .env.staging .env.production
  envlint schema --json                  Dump parsed schema as JSON
  envlint init                           Generate .env.schema from .env
  envlint init --from .env.staging --out .env.staging.schema

Exit codes:
  0  No errors (warnings may be present)
  1  One or more errors found
  2  Fatal error (file not found, bad arguments)
`;

/**
 * Main entry point.
 */
function main() {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case 'help':
      process.stdout.write(HELP_TEXT);
      process.exit(0);
      break;

    case 'check':
      runCheck(args);
      break;

    case 'diff':
      runDiff(args);
      break;

    case 'schema':
      runSchema(args);
      break;

    case 'init':
      runInit(args);
      break;

    default:
      process.stderr.write(formatFatalError(`Unknown command: ${args.command}`));
      process.exit(2);
  }
}

/**
 * Runs the 'check' command: validate a .env file against the schema.
 *
 * @param {import('./src/args').Args} args
 */
function runCheck(args) {
  const envPath = args.files[0] || '.env';
  const schemaPath = args.schema;

  const envContent = readFileOrExit(envPath);
  if (envContent === null) {
    process.stderr.write(formatFatalError(`Cannot read env file: ${path.resolve(envPath)}`));
    process.exit(2);
  }

  const schemaContent = readFileOrExit(schemaPath);
  if (schemaContent === null) {
    process.stderr.write(formatFatalError(
      `Cannot read schema file: ${path.resolve(schemaPath)}\n` +
      `  Run 'envlint init' to generate one from your existing .env file.`
    ));
    process.exit(2);
  }

  const env = parseEnvContent(envContent);
  const schema = parseSchemaContent(schemaContent);
  const errors = validate(env, schema, { strict: args.strict });

  const output = formatValidation(path.resolve(envPath), errors, {
    json: args.json,
    quiet: args.quiet,
  });

  process.stdout.write(output);

  const hasErrors = errors.some(e => e.level === 'error');
  process.exit(hasErrors ? 1 : 0);
}

/**
 * Runs the 'diff' command: compare keys across multiple .env files.
 *
 * @param {import('./src/args').Args} args
 */
function runDiff(args) {
  if (args.files.length < 2) {
    process.stderr.write(formatFatalError(
      `diff requires at least 2 files.\n` +
      `  Usage: envlint diff <file1> <file2> [<file3>...]`
    ));
    process.exit(2);
  }

  const envs = [];
  for (const filePath of args.files) {
    const content = readFileOrExit(filePath);
    if (content === null) {
      process.stderr.write(formatFatalError(`Cannot read file: ${path.resolve(filePath)}`));
      process.exit(2);
    }
    envs.push({
      label: labelFromPath(filePath),
      env: parseEnvContent(content),
    });
  }

  const result = diffEnvs(envs);
  const output = formatDiff(result, { json: args.json });
  process.stdout.write(output);
  process.exit(0);
}

/**
 * Runs the 'schema' command: display the parsed schema.
 *
 * @param {import('./src/args').Args} args
 */
function runSchema(args) {
  const schemaPath = args.schema;
  const content = readFileOrExit(schemaPath);

  if (content === null) {
    process.stderr.write(formatFatalError(
      `Cannot read schema file: ${path.resolve(schemaPath)}\n` +
      `  Run 'envlint init' to generate one from your existing .env file.`
    ));
    process.exit(2);
  }

  const schema = parseSchemaContent(content);
  const output = formatSchema(schema, { json: args.json });
  process.stdout.write(output);
  process.exit(0);
}

/**
 * Runs the 'init' command: generate a starter .env.schema.
 *
 * @param {import('./src/args').Args} args
 */
function runInit(args) {
  const fromPath = args.from || '.env';
  const outPath = args.out || '.env.schema';

  const content = readFileOrExit(fromPath);
  if (content === null) {
    process.stderr.write(formatFatalError(`Cannot read source env file: ${path.resolve(fromPath)}`));
    process.exit(2);
  }

  const env = parseEnvContent(content);
  const schemaContent = generateSchema(env);

  if (fs.existsSync(path.resolve(outPath))) {
    process.stderr.write(formatFatalError(
      `${path.resolve(outPath)} already exists.\n` +
      `  Delete it first, or use --out to specify a different output path.`
    ));
    process.exit(2);
  }

  fs.writeFileSync(path.resolve(outPath), schemaContent, 'utf8');
  process.stdout.write(`\n  Schema written to ${path.resolve(outPath)}\n\n`);
  process.exit(0);
}

main();
