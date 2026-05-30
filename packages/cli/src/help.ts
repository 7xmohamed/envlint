export const HELP_TEXT = `
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
  --quiet, -q            Suppress output when no issues are found
  --no-color             Disable ANSI colors
  --from <path>          Source .env for init (default: .env)
  --out <path>           Output path for init (default: .env.schema)
  --help, -h             Show this help

Examples:
  envlint check
  envlint check .env.staging
  envlint check .env --strict
  envlint diff .env .env.staging
  envlint schema --json
  envlint init --from .env.staging --out .env.staging.schema

Exit codes:
  0  No errors found
  1  Validation errors found
  2  Fatal error (bad arguments, unreadable files, or refused writes)
`.trimStart();
