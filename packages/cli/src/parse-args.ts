import { CliUsageError } from './errors.js';
import type { CliArgs } from './types.js';

const KNOWN_COMMANDS = new Set(['check', 'diff', 'schema', 'init', 'help']);

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    command: 'check',
    files: [],
    schemaPath: '.env.schema',
    strict: false,
    json: false,
    quiet: false,
    noColor: false,
    fromPath: '.env',
    outPath: '.env.schema'
  };

  if (argv.length === 0) {
    args.command = 'help';
    return args;
  }

  const [firstToken] = argv;
  if (firstToken === '--help' || firstToken === '-h') {
    args.command = 'help';
    return args;
  }

  let index = 0;
  if (firstToken !== undefined && KNOWN_COMMANDS.has(firstToken)) {
    args.command = firstToken as CliArgs['command'];
    index = 1;
  }

  while (index < argv.length) {
    const token = argv[index];
    if (token === undefined) {
      break;
    }

    switch (token) {
      case '--schema':
      case '-s':
        args.schemaPath = requireValue(argv, index, token);
        index += 2;
        break;
      case '--strict':
        args.strict = true;
        index += 1;
        break;
      case '--json':
        args.json = true;
        index += 1;
        break;
      case '--quiet':
      case '-q':
        args.quiet = true;
        index += 1;
        break;
      case '--no-color':
        args.noColor = true;
        index += 1;
        break;
      case '--from':
        args.fromPath = requireValue(argv, index, token);
        index += 2;
        break;
      case '--out':
        args.outPath = requireValue(argv, index, token);
        index += 2;
        break;
      case '--help':
      case '-h':
        args.command = 'help';
        index += 1;
        break;
      default:
        if (token.startsWith('-')) {
          throw new CliUsageError(`Unknown option: ${token}`);
        }

        args.files.push(token);
        index += 1;
    }
  }

  return args;
}

function requireValue(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new CliUsageError(`Option ${option} requires a value.`);
  }

  return value;
}
