import { ColorPalette } from './types';

export const DEFAULT_COLORS: ColorPalette = {
  reset: '\u001b[0m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  cyan: '\u001b[36m',
  blue: '\u001b[34m',
  gray: '\u001b[90m',
};

export const DEFAULT_SKIP_PACKAGES = ['npm', 'npx', 'node-gyp', 'corepack', 'npm-migrate'] as const;

export const LOCK_STALE_MS = 5 * 60 * 1000;

export const CONFIG_DIR_NAME = '.npm-migrate';

export const CONFIG_FILE_NAME = 'packages.json';

export const LOCK_FILE_NAME = '.lock';
