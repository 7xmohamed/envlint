import {
  diffEnvs,
  generateSchema,
  parseEnvContent,
  parseSchemaContent,
  validate
} from '../../core/src/index.js';
import { CliUsageError } from './errors.js';
import { nodeFileSystem, type FileSystem } from './filesystem.js';
import { HELP_TEXT } from './help.js';
import {
  formatDiff,
  formatFatalError,
  formatSchema,
  formatValidation,
  shouldUseColor
} from './output.js';
import { parseArgs } from './parse-args.js';
import type { CliArgs, CommandResult } from './types.js';

export interface RunCliOptions {
  fs?: FileSystem;
}

export function runCli(argv: string[], options: RunCliOptions = {}): CommandResult {
  const fileSystem = options.fs ?? nodeFileSystem;

  try {
    const args = parseArgs(argv);
    const colorEnabled = shouldUseColor(args.noColor);

    switch (args.command) {
      case 'help':
        return { exitCode: 0, stdout: HELP_TEXT, stderr: '' };
      case 'check':
        return runCheck(args, fileSystem, colorEnabled);
      case 'diff':
        return runDiff(args, fileSystem, colorEnabled);
      case 'schema':
        return runSchema(args, fileSystem, colorEnabled);
      case 'init':
        return runInit(args, fileSystem, colorEnabled);
      default:
        return unreachableCommand(args.command);
    }
  } catch (error) {
    if (error instanceof CliUsageError) {
      return {
        exitCode: error.exitCode,
        stdout: '',
        stderr: formatFatalError(error.message, { colorEnabled: false })
      };
    }

    throw error;
  }
}

function runCheck(args: CliArgs, fileSystem: FileSystem, colorEnabled: boolean): CommandResult {
  if (args.files.length > 1) {
    throw new CliUsageError('check accepts at most one env file.');
  }

  const envPath = args.files[0] ?? '.env';
  const envContent = readRequiredFile(fileSystem, envPath, 'env file');
  const schemaContent = readRequiredFile(
    fileSystem,
    args.schemaPath,
    'schema file',
    "Run 'dotlint init' to generate one from your existing .env file."
  );

  const env = parseEnvContent(envContent);
  const schema = parseSchemaContent(schemaContent);
  const issues = validate(env, schema, { strict: args.strict });
  const stdout = formatValidation(fileSystem.resolve(envPath), issues, { colorEnabled }, {
    json: args.json,
    quiet: args.quiet
  });
  const hasErrors = issues.some((issue) => issue.level === 'error');

  return { exitCode: hasErrors ? 1 : 0, stdout, stderr: '' };
}

function runDiff(args: CliArgs, fileSystem: FileSystem, colorEnabled: boolean): CommandResult {
  if (args.files.length < 2) {
    throw new CliUsageError('diff requires at least 2 files.');
  }

  const envs = args.files.map((filePath) => ({
    label: fileSystem.basename(filePath),
    env: parseEnvContent(readRequiredFile(fileSystem, filePath, 'file'))
  }));

  return {
    exitCode: 0,
    stdout: formatDiff(diffEnvs(envs), { colorEnabled }, { json: args.json }),
    stderr: ''
  };
}

function runSchema(args: CliArgs, fileSystem: FileSystem, colorEnabled: boolean): CommandResult {
  if (args.files.length > 0) {
    throw new CliUsageError('schema does not accept positional env files.');
  }

  const schemaContent = readRequiredFile(
    fileSystem,
    args.schemaPath,
    'schema file',
    "Run 'dotlint init' to generate one from your existing .env file."
  );

  return {
    exitCode: 0,
    stdout: formatSchema(parseSchemaContent(schemaContent), { colorEnabled }, { json: args.json }),
    stderr: ''
  };
}

function runInit(args: CliArgs, fileSystem: FileSystem, colorEnabled: boolean): CommandResult {
  if (args.files.length > 0) {
    throw new CliUsageError('init does not accept positional env files.');
  }

  const source = readRequiredFile(fileSystem, args.fromPath, 'source env file');
  const destination = fileSystem.resolve(args.outPath);
  if (fileSystem.exists(destination)) {
    return {
      exitCode: 2,
      stdout: '',
      stderr: formatFatalError(
        `${destination} already exists.\n  Delete it first, or use --out to specify a different output path.`,
        { colorEnabled }
      )
    };
  }

  fileSystem.writeText(destination, generateSchema(parseEnvContent(source)));
  return {
    exitCode: 0,
    stdout: `\n  Schema written to ${destination}\n\n`,
    stderr: ''
  };
}

function readRequiredFile(
  fileSystem: FileSystem,
  filePath: string,
  label: string,
  helpText?: string
): string {
  const content = fileSystem.readText(filePath);
  if (content !== null) {
    return content;
  }

  const resolvedPath = fileSystem.resolve(filePath);
  const suffix = helpText === undefined ? '' : `\n  ${helpText}`;
  throw new CliUsageError(`Cannot read ${label}: ${resolvedPath}${suffix}`);
}

function unreachableCommand(command: never): CommandResult {
  throw new Error(`Unexpected command: ${String(command)}`);
}
