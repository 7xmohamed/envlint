import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

export interface FileSystem {
  exists(filePath: string): boolean;
  readText(filePath: string): string | null;
  writeText(filePath: string, content: string): void;
  resolve(filePath: string): string;
  basename(filePath: string): string;
}

export const nodeFileSystem: FileSystem = {
  exists(filePath) {
    return existsSync(path.resolve(filePath));
  },
  readText(filePath) {
    try {
      return readFileSync(path.resolve(filePath), 'utf8');
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  },
  writeText(filePath, content) {
    writeFileSync(path.resolve(filePath), content, 'utf8');
  },
  resolve(filePath) {
    return path.resolve(filePath);
  },
  basename(filePath) {
    return path.basename(filePath);
  }
};

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
