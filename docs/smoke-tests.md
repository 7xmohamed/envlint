# Smoke Tests

EnvLinter smoke coverage is currently implemented through `tests/e2e` and the GitHub Actions OS matrix.

## Commands

- `pnpm test:e2e`
- `pnpm check`

## Coverage goals

- CLI help and argument failures
- Validation success and failure flows
- Diff output that proves keys differ without exposing values
- Schema rendering and init generation
- Windows, Linux, and macOS execution through CI
