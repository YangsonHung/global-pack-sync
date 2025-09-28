import fs from 'fs';

export function ensureDirectory(directory: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

export function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return content ? (JSON.parse(content) as T) : null;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function backupFileIfExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
}

export function removeFileIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
