# Antigravity Guide

Use Antigravity in the same workflow as other agents:

1. Read `AGENTS.md`.
2. Run `pnpm install` if dependencies are missing.
3. Use `pnpm check` as the default verification gate.
4. Run `pnpm test:e2e` when command behavior or output changes.

Repository boundaries:

- `packages/core` owns parsing, schema, validation, diffing, and init inference.
- `packages/cli` owns arguments, filesystem access, formatters, and process behavior.

Non-negotiable rules:

- never expose raw env values in diff output
- treat malformed usage as exit code `2`
- add tests for parser edge cases and CLI regressions
