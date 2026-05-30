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

Generate a schema from an existing env file:

```bash
envlint init
```

Validate your env file:

```bash
envlint check
```

Compare multiple environments safely:

```bash
envlint diff .env .env.staging .env.production
```

## Commands

### `envlint check [file] [options]`

```bash
envlint check
envlint check .env.staging
envlint check .env --schema .env.schema
envlint check .env --strict
envlint check .env --json
envlint check .env --quiet
envlint check .env --no-color
```

### `envlint diff <file1> <file2> [file3...] [options]`

```bash
envlint diff .env .env.staging
envlint diff .env .env.production --json
```

### `envlint schema [options]`

```bash
envlint schema
envlint schema --json
```

### `envlint init [options]`

```bash
envlint init
envlint init --from .env.staging --out .env.staging.schema
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | No validation errors found |
| `1` | Validation errors found |
| `2` | Fatal error such as bad arguments or unreadable files |

## Schema format

Commit `.env.schema` to your repository. It contains keys and constraints, not secret values.

```text
# VAR_NAME [required|optional] [type=TYPE] [default=VALUE] [desc=Description]

DATABASE_URL required type=string desc=Primary database connection string
REDIS_URL optional type=string
PORT optional type=port default=3000
ENABLE_CACHE optional type=boolean default=false
TIMEOUT_MS optional type=number default=5000
EXTERNAL_API optional type=url
```

Supported types:

| Type | Accepted values |
|------|-----------------|
| `string` | Any non-empty string |
| `number` | Any finite number |
| `boolean` | `true`, `false`, `1`, `0`, `yes`, `no` |
| `url` | `http://` or `https://` URLs |
| `port` | Integer in `1..65535` |

See [`.env.schema.example`](./.env.schema.example) for a longer example.

## Notes

- `diff` never prints raw values
- malformed CLI usage exits with code `2`
- JSON output is available for CI and automation

## Development

```bash
pnpm install
pnpm check
pnpm test:e2e
```

Repo-specific guidance for contributors and coding agents lives in [CONTRIBUTING.md](./CONTRIBUTING.md), [AGENTS.md](./AGENTS.md), and [docs/agents/quickstart.md](./docs/agents/quickstart.md).

## License

[MIT](./LICENSE)
