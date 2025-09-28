import { execAsync } from './exec';
import type { ColorPalette, InstallResults, PackageManager, PackageMap } from '../types';

interface InstallOptions {
  packages: PackageMap;
  packageManager: PackageManager;
  concurrency: number;
  useLatestVersion: boolean;
  colors: ColorPalette;
  getLatestVersion: (name: string, packageManager: PackageManager) => Promise<string | null>;
}

export async function installPackagesConcurrently({
  packages,
  packageManager,
  concurrency,
  useLatestVersion,
  colors,
  getLatestVersion,
}: InstallOptions): Promise<InstallResults> {
  const entries = Object.entries(packages);
  const results: InstallResults = {
    succeeded: [],
    failed: [],
    skipped: [],
  };

  for (let index = 0; index < entries.length; index += concurrency) {
    const batch = entries.slice(index, index + concurrency);
    const tasks = batch.map(async ([name, savedVersion]) => {
      try {
        try {
          await execAsync(`${packageManager} list -g ${name} --depth=0`);
          console.log(`${colors.yellow}⚠ ${name} 已存在，跳过${colors.reset}`);
          results.skipped.push(`${name}@${savedVersion}`);
          return;
        } catch {
          // package not found, continue installation
        }

        let targetVersion = savedVersion;
        if (useLatestVersion) {
          const latest = await getLatestVersion(name, packageManager);
          if (latest) {
            targetVersion = latest;
          }
        }

        const versionInfo =
          useLatestVersion && targetVersion !== savedVersion
            ? `${savedVersion} → ${targetVersion}`
            : targetVersion;

        console.log(`${colors.blue}📦 安装 ${name}@${versionInfo}...${colors.reset}`);

        let installCommand: string;
        switch (packageManager) {
          case 'yarn':
            installCommand = `yarn global add ${name}@${targetVersion}`;
            break;
          case 'pnpm':
            installCommand = `pnpm add -g ${name}@${targetVersion}`;
            break;
          default:
            installCommand = `npm install -g ${name}@${targetVersion}`;
        }

        await execAsync(installCommand, { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 });

        console.log(`${colors.green}✓ ${name}@${targetVersion} 安装成功${colors.reset}`);
        results.succeeded.push(`${name}@${targetVersion}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${colors.red}✗ 安装 ${name} 失败: ${message}${colors.reset}`);
        results.failed.push(`${name}@${savedVersion}`);
      }
    });

    await Promise.all(tasks);
  }

  return results;
}
