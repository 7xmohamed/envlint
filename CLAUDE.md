# Claude Code Notes

- Start with `pnpm check` after substantial changes.
- Read `AGENTS.md` for package boundaries and invariants.
- Do not read secrets from local `.env` files unless the user explicitly asks.
- Use `tests/e2e` for end-to-end CLI coverage when command behavior changes.
