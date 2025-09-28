export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export type PackageMap = Record<string, string>;

export interface Profile {
  nodeVersion: string;
  npmVersion: string;
  packageManager: PackageManager;
  packages: PackageMap;
  savedAt: string;
  packagesCount: number;
  platform: string;
  arch: string;
}

export type Config = Record<string, Profile>;

export interface InstallResults {
  succeeded: string[];
  failed: string[];
  skipped: string[];
}

export interface CommonOptions {
  packageManager?: PackageManager | string;
  concurrency?: number;
  useLatestVersion?: boolean;
}

export interface VersionInfo {
  nodeVersion: string;
  npmVersion: string;
}

export interface LockData {
  pid: number;
  timestamp: number;
}

export interface GlobalPackSyncOptions {
  configDir?: string;
}

export type ColorKey = 'reset' | 'green' | 'yellow' | 'red' | 'cyan' | 'blue' | 'gray';

export type ColorPalette = Record<ColorKey, string>;

