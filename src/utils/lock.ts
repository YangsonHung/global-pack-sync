import fs from 'fs';

import { LOCK_STALE_MS } from '../constants';
import type { LockData } from '../types';

export function readLockFile(lockFile: string): LockData | null {
  if (!fs.existsSync(lockFile)) {
    return null;
  }

  const raw = fs.readFileSync(lockFile, 'utf-8');
  return JSON.parse(raw) as LockData;
}

export function writeLockFile(lockFile: string, data: LockData): void {
  fs.writeFileSync(lockFile, JSON.stringify(data));
}

export function clearLockFile(lockFile: string): void {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
}

export function isLockActive(lock: LockData, now = Date.now()): boolean {
  return now - lock.timestamp < LOCK_STALE_MS;
}
