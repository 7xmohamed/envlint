import type { DiffResult, SchemaEntry, ValidationIssue } from '../../core/src/index.js';

interface RenderContext {
  colorEnabled: boolean;
}

interface ValidationRenderOptions {
  json?: boolean;
  quiet?: boolean;
}

interface SchemaRenderOptions {
  json?: boolean;
}

interface DiffRenderOptions {
  json?: boolean;
}

const COLORS = {
  reset: '\u001B[0m',
  bold: '\u001B[1m',
  dim: '\u001B[2m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  yellow: '\u001B[33m',
  cyan: '\u001B[36m',
  gray: '\u001B[90m'
} as const;

export function shouldUseColor(noColorFlag: boolean): boolean {
  return process.stdout.isTTY && !noColorFlag && !process.env.NO_COLOR && process.env.TERM !== 'dumb';
}

export function formatFatalError(message: string, context: RenderContext): string {
  return `\n  ${colorize('error', 'red', context)}  ${message}\n`;
}

export function formatValidation(
  filePath: string,
  issues: ValidationIssue[],
  context: RenderContext,
  options: ValidationRenderOptions = {}
): string {
  if (options.json) {
    return `${JSON.stringify({ file: filePath, issues }, null, 2)}\n`;
  }

  const errorCount = issues.filter((issue) => issue.level === 'error').length;
  const warningCount = issues.length - errorCount;

  if (issues.length === 0) {
    if (options.quiet) {
      return '';
    }

    const quietSuccessLines = ['', colorize(`Validating: ${filePath}`, 'bold', context), '', colorize('  No issues found.', 'green', context), ''];
    return quietSuccessLines.join('\n');
  }

  const lines: string[] = ['', colorize(`Validating: ${filePath}`, 'bold', context), ''];
  for (const issue of issues) {
    const label = issue.level === 'error'
      ? colorize('error', 'red', context)
      : colorize('warn ', 'yellow', context);
    lines.push(`  ${label}  ${colorize(issue.key, 'bold', context)}  ${issue.message}`);
  }

  lines.push('');
  const summaryParts: string[] = [];
  if (errorCount > 0) {
    summaryParts.push(colorize(`${String(errorCount)} error${errorCount === 1 ? '' : 's'}`, 'red', context));
  }
  if (warningCount > 0) {
    summaryParts.push(colorize(`${String(warningCount)} warning${warningCount === 1 ? '' : 's'}`, 'yellow', context));
  }
  lines.push(`  Found ${summaryParts.join(', ')}`);
  lines.push('');
  return lines.join('\n');
}

export function formatDiff(diff: DiffResult, context: RenderContext, options: DiffRenderOptions = {}): string {
  if (options.json) {
    return `${JSON.stringify(diff, null, 2)}\n`;
  }

  const lines: string[] = ['', colorize('Environment diff (values hidden):', 'bold', context), ''];
  if (diff.rows.length === 0) {
    lines.push(colorize('  All keys match across environments.', 'green', context), '');
    return lines.join('\n');
  }

  const keyWidth = Math.max('KEY'.length, ...diff.rows.map((row) => row.key.length));
  const envWidth = Math.max('present'.length, ...diff.labels.map((label) => label.length));
  const header = diff.labels.map((label) => colorize(pad(label, envWidth), 'bold', context)).join('  ');

  lines.push(`  ${colorize(pad('KEY', keyWidth), 'bold', context)}  ${header}`);
  lines.push(colorize(`  ${'-'.repeat(keyWidth)}  ${diff.labels.map(() => '-'.repeat(envWidth)).join('  ')}`, 'dim', context));

  for (const row of diff.rows) {
    const statuses = row.statuses
      .map((status) => colorizeStatus(pad(status, envWidth), status, context))
      .join('  ');
    lines.push(`  ${pad(row.key, keyWidth)}  ${statuses}`);
  }

  lines.push('', `  ${String(diff.rows.length)} key${diff.rows.length === 1 ? '' : 's'} differ`, '');
  return lines.join('\n');
}

export function formatSchema(
  schema: Map<string, SchemaEntry>,
  context: RenderContext,
  options: SchemaRenderOptions = {}
): string {
  if (options.json) {
    return `${JSON.stringify(Object.fromEntries(schema), null, 2)}\n`;
  }

  const entries = [...schema.values()];
  if (entries.length === 0) {
    return '\n  Schema is empty.\n';
  }

  const lines: string[] = [
    '',
    colorize(`Schema (${String(entries.length)} variable${entries.length === 1 ? '' : 's'})`, 'bold', context),
    ''
  ];

  for (const entry of entries) {
    const parts = [
      entry.required ? colorize('required', 'red', context) : colorize('optional', 'dim', context),
      colorize(`type=${entry.type}`, 'cyan', context),
      entry.defaultValue === null ? '' : colorize(`default=${entry.defaultValue}`, 'gray', context)
    ].filter(Boolean);
    const description = entry.description === '' ? '' : colorize(`  # ${entry.description}`, 'dim', context);
    lines.push(`  ${colorize(entry.name, 'bold', context)}  ${parts.join('  ')}${description}`);
  }

  lines.push('');
  return lines.join('\n');
}

function colorize(text: string, color: keyof typeof COLORS, context: RenderContext): string {
  if (!context.colorEnabled) {
    return text;
  }

  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function pad(text: string, width: number): string {
  return text.padEnd(width, ' ');
}

function colorizeStatus(text: string, status: string, context: RenderContext): string {
  if (status === 'present') {
    return colorize(text, 'green', context);
  }
  if (status === 'empty') {
    return colorize(text, 'yellow', context);
  }

  return colorize(text, 'red', context);
}
