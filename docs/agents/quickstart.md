# Agent Quickstart

## Repo workflow

1. Read `AGENTS.md`.
2. Install dependencies with `pnpm install`.
3. Run `pnpm check` before and after meaningful changes.
4. Run `pnpm test:e2e` when CLI behavior changes.

## Architecture

- Domain logic lives in `packages/core`.
- Process and output concerns live in `packages/cli`.

## Safety

- Do not leak env values in diffs.
- Treat malformed CLI usage as a fatal error.
