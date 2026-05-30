# Contributing

Contributions are welcome. Before opening a PR, please read this document.

---

## Setup

No install step required. The project has zero runtime dependencies.

```bash
git clone git@github.com:7xmohamed/envlint.git
cd envlint
node cli.js help
```

## Running tests

```bash
npm test
```

All tests are in `test/test.js`. The test runner is built on Node.js `assert` - no test framework required.

## Adding a test

Each module has a dedicated section in `test/test.js`. Add your test to the relevant section using the `test(name, fn)` helper:

```js
test('my new test', () => {
  const result = someFunction('input');
  assert.strictEqual(result, 'expected');
});
```

## Code style

- Node.js stdlib only. Do not add dependencies.
- Every function does one thing. If a function has more than one reason to change, split it.
- Comments explain why, not what.
- No `console.log` in `src/` or `cli.js`. Use `process.stdout.write` / `process.stderr.write`.
- All output goes through `src/output.js`. Do not format strings inline in command handlers.

## Adding a new type

1. Add the type name to the `type=` option list in `src/schema.js` (the `if` inside `parseSchemaLine`)
2. Add a `checkYourType()` function in `src/validate.js` following the existing pattern
3. Add a `case 'yourtype':` to the `checkType()` switch
4. Add tests in `test/test.js` under the `validate.js` section

## Adding a new command

1. Add the command name to `knownCommands` in `src/args.js`
2. Add any new flags to `parseArgs()` in `src/args.js`
3. Add a `runYourCommand(args)` function in `cli.js`
4. Add the `case 'yourcommand':` dispatch in `main()` in `cli.js`
5. Add usage to `HELP_TEXT` in `cli.js`
6. Document it in `README.md`

## Pull request checklist

- [ ] `npm test` passes with no failures
- [ ] New behavior has test coverage
- [ ] README is updated if a user-facing change was made
- [ ] No new dependencies added
- [ ] No `console.log` left in source files


## Reporting bugs

Open an issue on GitHub. Include:
- The exact command you ran
- The `.env.schema` content (with real values replaced by placeholders)
- The `.env` content (same - replace real values)
- The full output of the command
- Your Node.js version (`node --version`)
