export class CliUsageError extends Error {
  public readonly exitCode = 2;

  public constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}
