# EnvLinter Agent Guide

EnvLinter is a typed Node.js workspace with two packages:

- `packages/core`: pure domain logic
- `packages/cli`: filesystem, process, argument, and output adapters

## Safe commands

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm check`

## Invariants

- Never expose env values in `diff` output.
- Treat CLI parse failures as exit code `2`.
- Keep parsing and validation logic in `packages/core`.
- Keep output formatting and process exits in `packages/cli`.

## File map

- `packages/core/src`: typed domain logic
- `packages/core/test`: unit tests
- `packages/cli/src`: command and formatting logic
- `packages/cli/test`: CLI unit tests
- `tests/e2e`: executable workflow coverage
- `docs/architecture`: architecture and ADRs
- `docs/agents`: agent-facing workflow docs
