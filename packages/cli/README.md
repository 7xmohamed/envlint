# EnvLinter

Validate `.env` files against a committed schema and compare environments without printing raw values.

## Install

```bash
npm install -g dotlint
```

Or run it without installing:

```bash
npx dotlint check
```

## Quick start

```bash
dotlint init
dotlint check
dotlint diff .env .env.staging .env.production
```

## Commands

```bash
dotlint check [file] [--schema path] [--strict] [--json] [--quiet] [--no-color]
dotlint diff <file1> <file2> [file3...] [--json]
dotlint schema [--schema path] [--json]
dotlint init [--from path] [--out path]
```

## Exit codes

- `0`: no validation errors
- `1`: validation errors found
- `2`: fatal error such as bad arguments or unreadable files

## Schema format

```text
# VAR_NAME [required|optional] [type=TYPE] [default=VALUE] [desc=Description]

DATABASE_URL required type=string
PORT optional type=port default=3000
ENABLE_CACHE optional type=boolean default=false
```

Supported types: `string`, `number`, `boolean`, `url`, `port`

`diff` output never prints raw values.
