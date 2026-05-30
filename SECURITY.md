# Security Policy

## Supported versions

Only the latest published major version is supported with security fixes.

## Reporting a vulnerability

Please report security issues privately through GitHub security advisories or by contacting the maintainer directly. Do not open a public issue for a suspected secret-handling or data-exposure flaw.

## Security guarantees

- `dotlint diff` must never print raw values.
- JSON and text validation output may include keys and diagnostics, but not redacted secret values because EnvLinter validates files locally rather than transmitting them.
