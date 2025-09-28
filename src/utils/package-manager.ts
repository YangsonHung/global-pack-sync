import { execSync } from 'child_process';

import { execAsync } from './exec';
import type { PackageManager, PackageMap } from '../types';

export function normalizePackageManager(value?: string): PackageManager {
  if (value === 'npm' || value === 'yarn' || value === 'pnpm') {
    return value;
  }
  return 'npm';
}

export function detectPackageManager(): PackageManager {
  const managers: PackageManager[] = ['npm', 'yarn', 'pnpm'];
  for (const manager of managers) {
    try {
      execSync(`${manager} --version`, { stdio: 'ignore' });
      return manager;
    } catch {
      // continue searching
    }
  }
  return 'npm';
}

export function listGlobalPackages(
  packageManager: PackageManager,
  skipPackages: Set<string>,
): PackageMap {
  let command: string;
  switch (packageManager) {
    case 'yarn':
      command = 'yarn global list --json';
      break;
    case 'pnpm':
      command = 'pnpm list -g --depth=0 --json';
      break;
    default:
      command = 'npm list -g --depth=0 --json';
  }

  const output = execSync(command, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore'],
  }) as string;

  const packages: PackageMap = {};

  if (packageManager === 'yarn') {
    const lines = output.split('\n').filter((line) => line.includes('"'));
    for (const line of lines) {
      const match = line.match(/"([^@\"]+)@([^\"]+)"/);
      if (match && !skipPackages.has(match[1])) {
        packages[match[1]] = match[2];
      }
    }
    return packages;
  }

  const data = JSON.parse(output) as { dependencies?: Record<string, { version?: string }> };
  const dependencies = data.dependencies ?? {};
  for (const [name, info] of Object.entries(dependencies)) {
    if (!skipPackages.has(name) && info?.version) {
      packages[name] = info.version;
    }
  }

  return packages;
}

export async function fetchLatestVersion(
  packageName: string,
  packageManager: PackageManager,
): Promise<string> {
  let command: string;
  switch (packageManager) {
    case 'yarn':
      command = `yarn info ${packageName} version --json`;
      break;
    case 'pnpm':
      command = `pnpm view ${packageName} version --json`;
      break;
    default:
      command = `npm view ${packageName} version --json`;
  }

  const { stdout } = await execAsync(command, { timeout: 10_000 });
  return stdout.replace(/"/g, '').trim();
}
