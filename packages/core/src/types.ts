export type EnvMap = Map<string, string>;

export type SchemaType = 'string' | 'number' | 'boolean' | 'url' | 'port';

export interface SchemaEntry {
  name: string;
  required: boolean;
  defaultValue: string | null;
  type: SchemaType;
  description: string;
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  key: string;
  message: string;
  rule: string;
}

export type DiffStatus = 'present' | 'missing' | 'empty';

export interface DiffRow {
  key: string;
  statuses: DiffStatus[];
}

export interface DiffResult {
  labels: string[];
  rows: DiffRow[];
}
