# Architecture Overview

EnvLinter is organized around a small boundary:

- `@envlinter/core` is a pure TypeScript library for parsing, schema modeling, validation, diffing, and schema generation.
- `envlinter` is the CLI package that handles argument parsing, filesystem access, process exits, and human or JSON output.

This split keeps the rules engine reusable for future editor integrations, AI agents, and library consumers without coupling them to terminal behavior.
