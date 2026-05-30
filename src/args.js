'use strict';

/**
 * Argument parser for envlint CLI.
 *
 * Parses process.argv into a structured Args object without any
 * external dependencies.
 *
 * Supported invocations:
 *
 *   envlint check [options] [<file>]
 *     --schema, -s <path>    Schema file (default: .env.schema)
 *     --strict               Treat undeclared variables as errors
 *     --json                 Output results as JSON
 *     --quiet                Suppress output on success
 *     <file>                 .env file to check (default: .env)
 *
 *   envlint diff [options] <file1> <file2> [<file3>...]
 *     --json                 Output results as JSON
 *
 *   envlint schema [options]
 *     --schema, -s <path>    Schema file (default: .env.schema)
 *     --json                 Output as JSON
 *
 *   envlint init
 *     Generate a starter .env.schema from an existing .env file
 *     --from <path>          Source .env file (default: .env)
 *     --out <path>           Output schema file (default: .env.schema)
 *
 *   envlint help
 *
 * @param {string[]} argv - process.argv.slice(2)
 * @returns {Args}
 *
 * @typedef {Object} Args
 * @property {string} command - 'check'|'diff'|'schema'|'init'|'help'
 * @property {string[]} files - positional file arguments
 * @property {string} schema - schema file path
 * @property {boolean} strict
 * @property {boolean} json
 * @property {boolean} quiet
 * @property {string|null} from - for init command
 * @property {string|null} out - for init command
 */
function parseArgs(argv) {
  const args = {
    command: 'check',
    files: [],
    schema: '.env.schema',
    strict: false,
    json: false,
    quiet: false,
    from: null,
    out: null,
  };

  if (argv.length === 0) {
    args.command = 'help';
    return args;
  }

  const firstArg = argv[0];
  const knownCommands = ['check', 'diff', 'schema', 'init', 'help', '--help', '-h'];

  if (knownCommands.includes(firstArg)) {
    if (firstArg === '--help' || firstArg === '-h') {
      args.command = 'help';
    } else {
      args.command = firstArg;
    }
    argv = argv.slice(1);
  } else if (firstArg.startsWith('-')) {
    // No command given, default to 'check'
    args.command = 'check';
  } else {
    // Positional argument without a command prefix - treat as 'check <file>'
    args.command = 'check';
  }

  let i = 0;
  while (i < argv.length) {
    const token = argv[i];

    if (token === '--schema' || token === '-s') {
      args.schema = argv[i + 1] || '.env.schema';
      i += 2;
    } else if (token === '--strict') {
      args.strict = true;
      i++;
    } else if (token === '--json') {
      args.json = true;
      i++;
    } else if (token === '--quiet' || token === '-q') {
      args.quiet = true;
      i++;
    } else if (token === '--from') {
      args.from = argv[i + 1] || null;
      i += 2;
    } else if (token === '--out') {
      args.out = argv[i + 1] || null;
      i += 2;
    } else if (token === '--help' || token === '-h') {
      args.command = 'help';
      i++;
    } else if (!token.startsWith('-')) {
      args.files.push(token);
      i++;
    } else {
      // Unknown flag - skip
      i++;
    }
  }

  return args;
}

module.exports = { parseArgs };
