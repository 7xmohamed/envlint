# Copilot Instructions

## Required workflow

1. Run `pnpm lint:fix` after meaningful code changes.
2. Run `pnpm check` before marking work complete.
3. Add a changeset when a published package changes.

## Project shape

- `packages/core` contains parsing, schema, validation, diffing, and initialization logic.
- `packages/cli` contains argument parsing, command execution, and output formatting.
- `tests/e2e` contains fixture-driven CLI tests.
- `docs/agents` contains instructions for AI coding agents.

## Rules

- Never print environment variable values in diff output.
- Prefer adding tests at the package level for logic changes and in `tests/e2e` for CLI behavior.
- Treat unknown flags and malformed command invocations as fatal usage errors.
