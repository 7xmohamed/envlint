# envlint

Validate your `.env` files against a declared schema. Catch missing or wrong-type variables before they crash your app. Diff environments without exposing secrets.

**Zero dependencies. No account. Works offline. Runs in CI.**

[![npm](https://img.shields.io/npm/v/envlint)](https://www.npmjs.com/package/envlint)
[![license](https://img.shields.io/github/license/7xmohamed/envlint)](LICENSE)
[![tests](https://img.shields.io/badge/tests-44%20passing-brightgreen)](#)

---

## The problem

Your app crashes in staging because `DATABASE_POOL_SIZE` is missing. Again.

Your `.env.example` has been wrong for six months. Nobody noticed because nothing enforces it.

A new hire spends half a day debugging because `NODE_ENV` was set to `developement` (typo) and nobody caught it.

An AI coding assistant added three new env vars to your code. None of them made it into `.env.example`.

You want to know whether staging and production have the same keys configured without printing either file to your terminal.

---

## Why existing tools fail

- `dotenv-safe`: checks that keys in `.env.example` exist in `.env`. That is it. No types. No diff. No reverse check. Last significant update: 2021.
- `Doppler`, `Infisical`, `HashiCorp Vault`: require accounts, cloud infrastructure, or a server to run. The overhead is not justified for "catch a missing variable before it hits CI".
- Manual `.env.example`: decays within weeks. There is no enforcement.
- `direnv`: runtime injection. No validation concept.

The gap is a fast, offline linter that treats environment configuration like code.

---

## Install

```bash
npm install -g envlint
```

Or run without installing:

```bash
npx envlint check
```

Or clone and run directly - no `npm install` needed:

```bash
git clone git@github.com:7xmohamed/envlint.git
cd envlint
node cli.js help
```

---

## Quick start

**Step 1: Generate a schema from your existing `.env` file**

```bash
envlint init
```

This creates `.env.schema` with all your current keys, marked `required` by default, with inferred types. Edit it to mark things optional, add descriptions, and set defaults.

Alternatively, copy `.env.schema.example` from this repo as a starting point.

**Step 2: Validate**

```bash
envlint check
```

Output on success:

```
  No issues found.
```

Output on failure:

```
  error  DATABASE_URL  required variable is missing or empty
  error  PORT          expected a port number (1-65535), got "abc"
  warn   LEGACY_FLAG   variable is not declared in schema

  Found 2 errors, 1 warning
```

Exit code `1` when errors are found, `0` when clean or warnings-only.

**Step 3: Add to CI**

```yaml
# GitHub Actions
- name: Validate environment
  run: npx envlint check --schema .env.schema
```

```bash
# Pre-commit hook (add to .git/hooks/pre-commit)
npx envlint check --quiet
```

---

## Commands

### `envlint check [file] [options]`

Validates a `.env` file against a schema.

```bash
envlint check                          # validates .env against .env.schema
envlint check .env.staging             # validate a specific file
envlint check .env --schema myschema   # custom schema path
envlint check .env --strict            # undeclared vars become errors
envlint check .env --json              # machine-readable output
envlint check .env --quiet             # no output on success (exit code only)
```

Exit codes:

| Code | Meaning |
|------|---------|
| `0` | No errors (warnings may be present) |
| `1` | One or more errors found |
| `2` | Fatal error (file not found, bad arguments) |

---

### `envlint diff <file1> <file2> [file3...]`

Compares keys across multiple `.env` files. **Values are never printed.**

```bash
envlint diff .env .env.staging
envlint diff .env .env.staging .env.production
envlint diff .env .env.staging --json
```

Example output:

```
  Environment diff (values hidden):

  KEY        .env       .env.staging   .env.production
  ---------  ---------  -------------  ---------------
  PORT       present    present        missing
  REDIS_URL  missing    present        present

  2 keys differ
```

Safe to run in CI logs. The actual values are never part of the output.

---

### `envlint schema [options]`

Displays the parsed schema in human-readable or JSON format.

```bash
envlint schema
envlint schema --schema .env.staging.schema
envlint schema --json
```

---

### `envlint init [options]`

Generates a starter `.env.schema` from an existing `.env` file.

```bash
envlint init                                           # .env -> .env.schema
envlint init --from .env.staging --out staging.schema
```

Types are inferred from the current values. The generated schema marks all keys `required` by default - edit it to relax constraints, add descriptions, and set defaults.

---

## Schema format

Commit `.env.schema` to your repository. It has no secrets - only keys, types, and constraints.

```
# One variable per line
# VAR_NAME [required|optional] [type=TYPE] [default=VALUE] [desc=Description]

DATABASE_URL required type=string desc=Primary database connection string
REDIS_URL optional type=string desc=Redis connection string
PORT optional type=port default=3000 desc=HTTP server port
NODE_ENV required type=string desc=development, staging, or production
SECRET_KEY required type=string desc=Token signing secret
ENABLE_CACHE optional type=boolean default=false
TIMEOUT_MS optional type=number default=5000
EXTERNAL_API optional type=url desc=Must be https://
```

Supported types:

| Type | Accepted values |
|------|-----------------|
| `string` | Any non-empty string (default) |
| `number` | Any finite number (e.g., `3.14`, `-1`, `1000`) |
| `boolean` | `true`, `false`, `1`, `0`, `yes`, `no` |
| `url` | `http://` or `https://` URLs only |
| `port` | Integer between `1` and `65535` |

A full annotated example is available in [`.env.schema.example`](.env.schema.example).

---

## Design decisions

**Values never leave the process.** The `diff` command outputs only `present`, `missing`, or `empty` - never the actual value. Safe to paste in Slack, paste in a bug report, run in CI.

**Zero dependencies.** The entire tool is Node.js standard library. No supply chain to audit. No `npm install` needed to run.

**Composable.** Exit codes and `--json` output integrate with any CI system, shell pipeline, or pre-commit hook without additional tooling.

**Incremental adoption.** Start with `envlint init` to bootstrap a schema from your existing setup, then tighten constraints over time as the team builds confidence.

---

## Project structure

```
envlint/
  cli.js                 - entry point, subcommand dispatch
  src/
    args.js              - argument parser
    parse.js             - .env file parser
    schema.js            - .env.schema parser
    validate.js          - validation engine
    diff.js              - multi-env key diff
    init.js              - schema generator with type inference
    output.js            - terminal formatter (color, NO_COLOR, JSON)
    files.js             - file I/O abstraction
  test/
    test.js              - 44 self-contained tests, zero deps
  .env.schema.example    - schema template to copy into your project
  .gitignore

  CONTRIBUTING.md
  LICENSE
  package.json
  README.md
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE) - 2026 [7xmohamed](https://github.com/7xmohamed)
