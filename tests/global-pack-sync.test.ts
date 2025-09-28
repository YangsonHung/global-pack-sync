import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GlobalPackSync } from '../src/index';

const createProfile = (packages: Record<string, string>) => ({
  nodeVersion: 'v18.17.0',
  npmVersion: '9.6.7',
  packageManager: 'npm' as const,
  packages,
  savedAt: '2024-01-01T00:00:00.000Z',
  packagesCount: Object.keys(packages).length,
  platform: 'win32',
  arch: 'x64',
});

describe('GlobalPackSync', () => {
  let tempRoot: string;
  let configDir: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'global-pack-sync-test-'));
    configDir = path.join(tempRoot, '.global-pack-sync');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (tempRoot && fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('saves global package snapshot to the configured directory', async () => {
    const migrator = new GlobalPackSync({ configDir });

    vi.spyOn(migrator, 'detectPackageManager').mockReturnValue('npm');
    vi.spyOn(migrator, 'getGlobalPackages').mockResolvedValue({
      typescript: '5.4.0',
      eslint: '9.0.0',
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await migrator.save('test-profile');

    logSpy.mockRestore();

    const configPath = path.join(configDir, 'packages.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config['test-profile'].packages).toEqual({
      typescript: '5.4.0',
      eslint: '9.0.0',
    });

    const lockPath = path.join(configDir, '.lock');
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('restores packages using saved profile metadata', async () => {
    const migrator = new GlobalPackSync({ configDir });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, 'packages.json');
    const profileName = 'saved-profile';
    const profile = createProfile({ nodemon: '3.0.1' });
    fs.writeFileSync(configPath, JSON.stringify({ [profileName]: profile }, null, 2));

    vi.spyOn(
      migrator as unknown as {
        getCurrentVersions: () => { nodeVersion: string; npmVersion: string };
      },
      'getCurrentVersions',
    ).mockReturnValue({ nodeVersion: 'v20.0.0', npmVersion: '10.0.0' });

    const installSpy = vi
      .spyOn(migrator, 'installPackagesConcurrently')
      .mockResolvedValue({ succeeded: ['nodemon@3.0.1'], failed: [], skipped: [] });

    await migrator.restore(profileName, { useLatestVersion: false });

    expect(installSpy).toHaveBeenCalledWith(profile.packages, 'npm', 3, false);

    logSpy.mockRestore();
  });

  it('prints diff between two saved profiles', () => {
    const migrator = new GlobalPackSync({ configDir });
    fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, 'packages.json');

    const config = {
      legacy: createProfile({ eslint: '8.0.0', typescript: '4.9.0' }),
      current: createProfile({ eslint: '9.0.0', prettier: '3.2.5' }),
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    migrator.diff('legacy', 'current');

    const outputs = logSpy.mock.calls.flat().join('\n');
    expect(outputs).toContain('+ prettier@3.2.5');
    expect(outputs).toContain('~ eslint: 8.0.0 → 9.0.0');

    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
