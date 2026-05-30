export interface CliArgs {
  command: 'check' | 'diff' | 'schema' | 'init' | 'help';
  files: string[];
  schemaPath: string;
  strict: boolean;
  json: boolean;
  quiet: boolean;
  noColor: boolean;
  fromPath: string;
  outPath: string;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
