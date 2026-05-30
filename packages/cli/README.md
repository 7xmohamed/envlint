# envlint

Validate `.env` files against a committed schema and compare environments without printing raw values.

## Install

```bash
npm install -g @7xmohamed/envlint
```

Or run it without installing:

```bash
npx @7xmohamed/envlint check
```

## Quick start

```bash
envlint init
envlint check
envlint diff .env .env.staging .env.production
```

## Commands

```bash
envlint check [file] [--schema path] [--strict] [--json] [--quiet] [--no-color]
envlint diff <file1> <file2> [file3...] [--json]
envlint schema [--schema path] [--json]
envlint init [--from path] [--out path]
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
