# Contributing

Contributions are welcome.

## Prerequisites

- Node.js 22 or newer
- pnpm 10.15.1 or newer

## Setup

```bash
git clone git@github.com:7xmohamed/envlinter.git
cd envlint
pnpm install
pnpm check
```

## Repository layout

- `packages/core`: parser, schema model, validation, diffing, and init inference
- `packages/cli`: CLI argument parsing, filesystem access, formatters, and command orchestration
- `tests/e2e`: end-to-end CLI coverage
- `docs/architecture`: design and architecture notes
- `docs/agents`: guidance for AI agents and scripted contributors

## Required verification

Run these before opening a PR:

```bash
pnpm lint:fix
pnpm check
pnpm test:e2e
```

## Testing guidance

- Put domain logic tests near the package that owns the logic.
- Add or update e2e coverage when CLI behavior changes.
- Prefer regression tests for parser edge cases, argument errors, and secret-safe output.

## Design rules

- Keep parsing and validation logic in `packages/core`.
- Keep output formatting and process concerns in `packages/cli`.
- Unknown flags and malformed invocations must fail with exit code `2`.
- `envlint diff` must never print raw values.
- Favor small, typed modules over broad utility layers.

## Release workflow

- Add a changeset when a published package changes.
- Release automation publishes with npm provenance from GitHub Actions.

## Reporting bugs

Include:

- the exact command
- the schema content with any secrets replaced
- the env content with any secrets replaced
- the full output
- the Node.js version
