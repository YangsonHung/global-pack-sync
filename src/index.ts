import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { promisify } from 'util';

const execAsync = promisify(exec);

type PackageManager = 'npm' | 'yarn' | 'pnpm';
type PackageMap = Record<string, string>;

interface Profile {
  nodeVersion: string;
  npmVersion: string;
  packageManager: PackageManager;
  packages: PackageMap;
  savedAt: string;
  packagesCount: number;
  platform: string;
  arch: string;
}

type Config = Record<string, Profile>;

interface InstallResults {
  succeeded: string[];
  failed: string[];
  skipped: string[];
}

interface CommonOptions {
  packageManager?: PackageManager | string;
  concurrency?: number;
  useLatestVersion?: boolean;
}

interface VersionInfo {
  nodeVersion: string;
  npmVersion: string;
}

interface LockData {
  pid: number;
  timestamp: number;
}

export interface NpmMigrateOptions {
  configDir?: string;
}

class NpmMigrate {
  private readonly configDir: string;
  private readonly configFile: string;
  private readonly lockFile: string;
  private readonly colors: Record<'reset' | 'green' | 'yellow' | 'red' | 'cyan' | 'blue' | 'gray', string>;
  private readonly skipPackages: Set<string>;

  constructor(options: NpmMigrateOptions = {}) {
    const configDir = options.configDir ?? path.join(os.homedir(), '.npm-migrate');
    this.configDir = configDir;
    this.configFile = path.join(configDir, 'packages.json');
    this.lockFile = path.join(configDir, '.lock');
    this.colors = {
      reset: '\u001b[0m',
      green: '\u001b[32m',
      yellow: '\u001b[33m',
      red: '\u001b[31m',
      cyan: '\u001b[36m',
      blue: '\u001b[34m',
      gray: '\u001b[90m',
    };
    this.skipPackages = new Set(['npm', 'npx', 'node-gyp', 'corepack', 'npm-migrate']);
  }

  private resolvePackageManager(value?: string): PackageManager {
    if (value === 'npm' || value === 'yarn' || value === 'pnpm') {
      return value;
    }
    return 'npm';
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  private checkLock(): void {
    if (fs.existsSync(this.lockFile)) {
      try {
        const raw = fs.readFileSync(this.lockFile, 'utf-8');
        const lock = JSON.parse(raw) as LockData;
        const now = Date.now();
        if (now - lock.timestamp < 5 * 60 * 1000) {
          console.error(`${this.colors.red}错误: 另一个 npm-migrate 进程正在运行 (PID: ${lock.pid})${this.colors.reset}`);
          process.exit(1);
        } else {
          fs.unlinkSync(this.lockFile);
        }
      } catch {
        fs.unlinkSync(this.lockFile);
      }
    }

    this.ensureConfigDir();
    fs.writeFileSync(this.lockFile, JSON.stringify({
      pid: process.pid,
      timestamp: Date.now(),
    } satisfies LockData));

    process.on('exit', () => this.clearLock());
    process.on('SIGINT', () => {
      this.clearLock();
      process.exit(0);
    });
  }

  private clearLock(): void {
    if (fs.existsSync(this.lockFile)) {
      fs.unlinkSync(this.lockFile);
    }
  }

  private getCurrentVersions(): VersionInfo {
    try {
      const nodeVersion = process.version;
      const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
      return { nodeVersion, npmVersion };
    } catch {
      return { nodeVersion: process.version, npmVersion: 'unknown' };
    }
  }

  private shouldSkipPackage(name: string): boolean {
    return this.skipPackages.has(name);
  }

  public detectPackageManager(): PackageManager {
    const managers: PackageManager[] = ['npm', 'yarn', 'pnpm'];
    for (const manager of managers) {
      try {
        execSync(`${manager} --version`, { stdio: 'ignore' });
        return manager;
      } catch {
        // continue
      }
    }
    return 'npm';
  }

  public async getGlobalPackages(packageManager: PackageManager = 'npm'): Promise<PackageMap> {
    try {
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
          if (match && !this.shouldSkipPackage(match[1])) {
            packages[match[1]] = match[2];
          }
        }
      } else {
        const data = JSON.parse(output) as { dependencies?: Record<string, { version?: string }> };
        const deps = data.dependencies ?? {};
        for (const [name, info] of Object.entries(deps)) {
          if (!this.shouldSkipPackage(name) && info?.version) {
            packages[name] = info.version;
          }
        }
      }

      return packages;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${this.colors.red}获取全局包列表失败:${this.colors.reset}`, message);
      return {};
    }
  }

  public async save(profileName: string | null = null, options: CommonOptions = {}): Promise<void> {
    this.checkLock();
    this.ensureConfigDir();

    try {
      const { nodeVersion, npmVersion } = this.getCurrentVersions();
      const packageManager = options.packageManager
        ? this.resolvePackageManager(options.packageManager)
        : this.detectPackageManager();
      const packages = await this.getGlobalPackages(packageManager);
      const profile = profileName || `node-${nodeVersion}-${Date.now()}`;

      let config: Config = {};
      if (fs.existsSync(this.configFile)) {
        const content = fs.readFileSync(this.configFile, 'utf-8');
        config = JSON.parse(content) as Config;
      }

      config[profile] = {
        nodeVersion,
        npmVersion,
        packageManager,
        packages,
        savedAt: new Date().toISOString(),
        packagesCount: Object.keys(packages).length,
        platform: os.platform(),
        arch: os.arch(),
      };

      if (fs.existsSync(this.configFile)) {
        const backupFile = `${this.configFile}.backup`;
        fs.copyFileSync(this.configFile, backupFile);
      }

      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));

      console.log(`${this.colors.green}✓ 已保存配置文件 '${profile}'${this.colors.reset}`);
      console.log(`  Node 版本: ${nodeVersion}`);
      console.log(`  npm 版本: ${npmVersion}`);
      console.log(`  包管理器: ${packageManager}`);
      console.log(`  包数量: ${Object.keys(packages).length}`);
      console.log(`  保存位置: ${this.configFile}`);

      if (Object.keys(packages).length > 0) {
        console.log(`\n${this.colors.cyan}已保存的包:${this.colors.reset}`);
        const names = Object.keys(packages).sort();
        for (const name of names) {
          console.log(`  ${this.colors.gray}-${this.colors.reset} ${name}@${packages[name]}`);
        }
      }
    } finally {
      this.clearLock();
    }
  }

  private async getLatestVersion(packageName: string, packageManager: PackageManager = 'npm'): Promise<string | null> {
    try {
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
    } catch {
      console.warn(`${this.colors.yellow}⚠ 无法获取 ${packageName} 的最新版本，使用保存的版本${this.colors.reset}`);
      return null;
    }
  }

  public async installPackagesConcurrently(
    packages: PackageMap,
    packageManager: PackageManager = 'npm',
    concurrency = 3,
    useLatestVersion = true,
  ): Promise<InstallResults> {
    const entries = Object.entries(packages);
    const results: InstallResults = { succeeded: [], failed: [], skipped: [] };

    for (let i = 0; i < entries.length; i += concurrency) {
      const batch = entries.slice(i, i + concurrency);
      const tasks = batch.map(async ([name, savedVersion]) => {
        try {
          try {
            await execAsync(`${packageManager} list -g ${name} --depth=0`);
            console.log(`${this.colors.yellow}⚠ ${name} 已存在，跳过${this.colors.reset}`);
            results.skipped.push(`${name}@${savedVersion}`);
            return;
          } catch {
            // continue installation
          }

          let targetVersion = savedVersion;
          if (useLatestVersion) {
            const latest = await this.getLatestVersion(name, packageManager);
            if (latest) {
              targetVersion = latest;
            }
          }

          const versionInfo =
            useLatestVersion && targetVersion !== savedVersion
              ? `${savedVersion} → ${targetVersion}`
              : targetVersion;

          console.log(`${this.colors.blue}📦 安装 ${name}@${versionInfo}...${this.colors.reset}`);

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

          console.log(`${this.colors.green}✓ ${name}@${targetVersion} 安装成功${this.colors.reset}`);
          results.succeeded.push(`${name}@${targetVersion}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`${this.colors.red}✗ 安装 ${name} 失败: ${message}${this.colors.reset}`);
          results.failed.push(`${name}@${savedVersion}`);
        }
      });

      await Promise.all(tasks);
    }

    return results;
  }

  private async installSelectedPackages(packages: PackageMap, options: CommonOptions = {}): Promise<void> {
    const packageManager = options.packageManager
      ? this.resolvePackageManager(options.packageManager)
      : 'npm';
    const useLatestVersion = options.useLatestVersion !== false;

    console.log(`\n${this.colors.cyan}开始安装选中的包...${this.colors.reset}`);

    const results = await this.installPackagesConcurrently(
      packages,
      packageManager,
      options.concurrency ?? 3,
      useLatestVersion,
    );

    console.log(`\n${this.colors.green}========== 安装完成 ==========${this.colors.reset}`);
    console.log(`${this.colors.green}成功: ${results.succeeded.length} 个包${this.colors.reset}`);
    console.log(`${this.colors.yellow}跳过: ${results.skipped.length} 个包${this.colors.reset}`);

    if (results.failed.length > 0) {
      console.log(`${this.colors.red}失败: ${results.failed.length} 个包${this.colors.reset}`);
      results.failed.forEach((pkg) => console.log(`  - ${pkg}`));
    }
  }

  public async selectiveRestore(profileName: string | null = null, options: CommonOptions = {}): Promise<void> {
    this.checkLock();

    if (!fs.existsSync(this.configFile)) {
      console.error(`${this.colors.red}错误: 配置文件不存在${this.colors.reset}`);
      this.clearLock();
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8')) as Config;

      let resolvedName = profileName;
      let profile: Profile | undefined;

      if (resolvedName) {
        profile = config[resolvedName];
        if (!profile) {
          console.error(`${this.colors.red}错误: 配置 '${resolvedName}' 不存在${this.colors.reset}`);
          this.listProfiles();
          return;
        }
      } else {
        const profiles = Object.entries(config);
        if (profiles.length === 0) {
          console.error(`${this.colors.red}错误: 没有保存的配置${this.colors.reset}`);
          return;
        }
        profiles.sort((a, b) => new Date(b[1].savedAt).getTime() - new Date(a[1].savedAt).getTime());
        resolvedName = profiles[0][0];
        profile = profiles[0][1];
      }

      if (!profile) {
        console.error(`${this.colors.red}错误: 未找到配置${this.colors.reset}`);
        return;
      }

      const entries = Object.entries(profile.packages);
      if (entries.length === 0) {
        console.log(`${this.colors.yellow}配置中没有包${this.colors.reset}`);
        return;
      }

      console.log(`${this.colors.cyan}选择要恢复的包 (配置: ${resolvedName}):${this.colors.reset}\n`);
      console.log(`${this.colors.yellow}包列表:${this.colors.reset}`);
      entries.forEach(([name, version], index) => {
        console.log(`  ${index + 1}. ${name}@${version}`);
      });

      console.log(`\n${this.colors.cyan}输入要跳过的包序号 (用空格分隔，直接回车安装全部):${this.colors.reset}`);

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

      const answer = await new Promise<string>((resolve) => {
        rl.question('', (response) => {
          rl.close();
          resolve(response);
        });
      });

      const skipIndices = answer.trim()
        ? answer
            .trim()
            .split(/\s+/)
            .map((value) => Number.parseInt(value, 10) - 1)
            .filter((value) => Number.isInteger(value) && value >= 0)
        : [];

      const selected: PackageMap = {};
      entries.forEach(([name, version], index) => {
        if (!skipIndices.includes(index)) {
          selected[name] = version;
        }
      });

      console.log(`\n${this.colors.green}将安装 ${Object.keys(selected).length} 个包${this.colors.reset}`);

      if (Object.keys(selected).length > 0) {
        await this.installSelectedPackages(selected, options);
      } else {
        console.log(`${this.colors.yellow}没有选择任何包${this.colors.reset}`);
      }
    } finally {
      this.clearLock();
    }
  }

  public async restore(profileName: string | null = null, options: CommonOptions = {}): Promise<void> {
    this.checkLock();

    if (!fs.existsSync(this.configFile)) {
      console.error(`${this.colors.red}错误: 配置文件不存在${this.colors.reset}`);
      console.log(`请先运行 ${this.colors.yellow}npm-migrate save${this.colors.reset} 保存当前环境`);
      this.clearLock();
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8')) as Config;

      let resolvedName = profileName;
      let profile: Profile | undefined;

      if (resolvedName) {
        profile = config[resolvedName];
        if (!profile) {
          console.error(`${this.colors.red}错误: 配置 '${resolvedName}' 不存在${this.colors.reset}`);
          this.listProfiles();
          return;
        }
      } else {
        const profiles = Object.entries(config);
        if (profiles.length === 0) {
          console.error(`${this.colors.red}错误: 没有保存的配置${this.colors.reset}`);
          return;
        }
        profiles.sort((a, b) => new Date(b[1].savedAt).getTime() - new Date(a[1].savedAt).getTime());
        resolvedName = profiles[0][0];
        profile = profiles[0][1];
      }

      if (!profile) {
        console.error(`${this.colors.red}错误: 未找到配置${this.colors.reset}`);
        return;
      }

      const { nodeVersion: currentNode, npmVersion: currentNpm } = this.getCurrentVersions();
      const packageManager = this.resolvePackageManager(options.packageManager ?? profile.packageManager);

      console.log(`${this.colors.cyan}开始恢复包配置 '${resolvedName}'${this.colors.reset}`);
      console.log(`  原 Node 版本: ${profile.nodeVersion} → 当前: ${currentNode}`);
      console.log(`  原 npm 版本: ${profile.npmVersion || 'unknown'} → 当前: ${currentNpm}`);
      console.log(`  包管理器: ${packageManager}`);
      console.log(`  待安装包数量: ${profile.packagesCount}`);

      if (profile.packagesCount === 0) {
        console.log(`${this.colors.yellow}没有需要安装的包${this.colors.reset}`);
        return;
      }

      console.log(`\n${this.colors.cyan}开始并行安装包...${this.colors.reset}`);
      const results = await this.installPackagesConcurrently(
        profile.packages,
        packageManager,
        options.concurrency ?? 3,
        options.useLatestVersion ?? true,
      );

      console.log(`\n${this.colors.green}========== 安装完成 ==========${this.colors.reset}`);
      console.log(`${this.colors.green}成功: ${results.succeeded.length} 个包${this.colors.reset}`);
      console.log(`${this.colors.yellow}跳过: ${results.skipped.length} 个包${this.colors.reset}`);

      if (results.failed.length > 0) {
        console.log(`${this.colors.red}失败: ${results.failed.length} 个包${this.colors.reset}`);
        console.log(`\n${this.colors.red}失败的包:${this.colors.reset}`);
        results.failed.forEach((pkg) => console.log(`  - ${pkg}`));

        const retryScript = path.join(this.configDir, 'retry-failed.sh');
        const commands = results.failed
          .map((pkg) => {
            const [name] = pkg.split('@');
            return `${packageManager} install -g ${pkg}`;
          })
          .join('\n');

        fs.writeFileSync(retryScript, `#!/bin/bash\n# 重试安装失败的包\n${commands}\n`);
        fs.chmodSync(retryScript, '755');

        console.log(`\n${this.colors.yellow}已生成重试脚本: ${retryScript}${this.colors.reset}`);
      }
    } finally {
      this.clearLock();
    }
  }

  public listProfiles(): void {
    if (!fs.existsSync(this.configFile)) {
      console.log(`${this.colors.yellow}还没有保存的配置${this.colors.reset}`);
      return;
    }

    const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8')) as Config;
    const profiles = Object.entries(config);

    if (profiles.length === 0) {
      console.log(`${this.colors.yellow}还没有保存的配置${this.colors.reset}`);
      return;
    }

    console.log(`${this.colors.cyan}已保存的配置 (${profiles.length} 个):${this.colors.reset}\n`);

    profiles.sort((a, b) => new Date(b[1].savedAt).getTime() - new Date(a[1].savedAt).getTime());

    profiles.forEach(([name, data], index) => {
      const latest = index === 0 ? ` ${this.colors.green}(最新)${this.colors.reset}` : '';
      console.log(`${this.colors.green}${name}${this.colors.reset}${latest}`);
      console.log(`  Node: ${data.nodeVersion} | npm: ${data.npmVersion || 'unknown'} | 包管理器: ${data.packageManager || 'npm'}`);
      console.log(`  包数量: ${data.packagesCount} | 平台: ${data.platform || 'unknown'}-${data.arch || 'unknown'}`);
      console.log(`  时间: ${new Date(data.savedAt).toLocaleString()}`);
      console.log('');
    });
  }

  public diff(profile1Name: string, profile2Name: string): void {
    if (!fs.existsSync(this.configFile)) {
      console.error(`${this.colors.red}错误: 配置文件不存在${this.colors.reset}`);
      return;
    }

    const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8')) as Config;
    const profile1 = config[profile1Name];
    const profile2 = config[profile2Name];

    if (!profile1) {
      console.error(`${this.colors.red}错误: 配置 '${profile1Name}' 不存在${this.colors.reset}`);
      return;
    }

    if (!profile2) {
      console.error(`${this.colors.red}错误: 配置 '${profile2Name}' 不存在${this.colors.reset}`);
      return;
    }

    const packages1 = profile1.packages;
    const packages2 = profile2.packages;

    const allPackages = new Set([...Object.keys(packages1), ...Object.keys(packages2)]);

    console.log(`${this.colors.cyan}配置差异对比: ${profile1Name} vs ${profile2Name}${this.colors.reset}\n`);

    let added = 0;
    let removed = 0;
    let updated = 0;
    let same = 0;

    allPackages.forEach((pkg) => {
      const v1 = packages1[pkg];
      const v2 = packages2[pkg];

      if (!v1 && v2) {
        console.log(`${this.colors.green}+ ${pkg}@${v2}${this.colors.reset} (新增)`);
        added += 1;
      } else if (v1 && !v2) {
        console.log(`${this.colors.red}- ${pkg}@${v1}${this.colors.reset} (移除)`);
        removed += 1;
      } else if (v1 && v2 && v1 !== v2) {
        console.log(`${this.colors.yellow}~ ${pkg}: ${v1} → ${v2}${this.colors.reset} (版本变更)`);
        updated += 1;
      } else {
        same += 1;
      }
    });

    console.log(`\n${this.colors.cyan}统计:${this.colors.reset}`);
    console.log(`  新增: ${added}, 移除: ${removed}, 更新: ${updated}, 相同: ${same}`);
  }

  public deleteProfile(profileName: string): void {
    if (!fs.existsSync(this.configFile)) {
      console.error(`${this.colors.red}错误: 配置文件不存在${this.colors.reset}`);
      return;
    }

    const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8')) as Config;

    if (!config[profileName]) {
      console.error(`${this.colors.red}错误: 配置 '${profileName}' 不存在${this.colors.reset}`);
      this.listProfiles();
      return;
    }

    delete config[profileName];
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));

    console.log(`${this.colors.green}✓ 已删除配置 '${profileName}'${this.colors.reset}`);
  }

  public showHelp(): void {
    console.log(`
${this.colors.cyan}npm-migrate - Node.js 全局 npm 包迁移工具 (增强版)${this.colors.reset}

${this.colors.yellow}使用方法:${this.colors.reset}
  npm-migrate <command> [options]

${this.colors.yellow}命令:${this.colors.reset}
  save [name]           保存当前环境的全局包列表
  restore [name]        恢复指定配置的包到当前环境 (默认使用最新版本)
  select [name]         选择性恢复包到当前环境
  list                  列出所有保存的配置
  diff <name1> <name2>  比较两个配置的差异
  delete <name>         删除指定配置
  help                  显示帮助信息

${this.colors.yellow}选项:${this.colors.reset}
  --pm <manager>        指定包管理器 (npm/yarn/pnpm)
  --concurrency <n>     并行安装的包数量 (默认: 3)
  --exact-version       使用保存时的确切版本 (默认使用最新版本)

${this.colors.yellow}示例:${this.colors.reset}
  # 保存当前环境
  npm-migrate save
  npm-migrate save my-packages

  # 切换 Node 版本后恢复包 (使用最新版本)
  nvm use 18.0.0
  npm-migrate restore
  npm-migrate restore my-packages --pm yarn

  # 使用保存时的确切版本恢复
  npm-migrate restore --exact-version

  # 选择性恢复包
  npm-migrate select my-packages

  # 查看和比较配置
  npm-migrate list
  npm-migrate diff old-config new-config

${this.colors.yellow}配置文件位置:${this.colors.reset}
  ${this.configFile}

${this.colors.yellow}特性:${this.colors.reset}
  - 默认使用最新版本，避免安全漏洞
  - 支持 npm/yarn/pnpm 包管理器
  - 并行安装提高速度
  - 选择性恢复功能
  - 配置差异对比
  - 失败重试脚本
  - 进程锁防止冲突
  - 自动过滤系统包 (npm, corepack, npm-migrate 等)
    `);
  }

  public async run(): Promise<void> {
    const args = process.argv.slice(2);
    const options: CommonOptions = {};
    const positional: string[] = [];

    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      if (arg === '--pm' && args[i + 1]) {
        options.packageManager = args[i + 1];
        i += 1;
        continue;
      }
      if (arg === '--concurrency' && args[i + 1]) {
        const value = Number.parseInt(args[i + 1], 10);
        if (Number.isFinite(value) && value > 0) {
          options.concurrency = value;
        }
        i += 1;
        continue;
      }
      if (arg === '--exact-version') {
        options.useLatestVersion = false;
        continue;
      }
      if (arg.startsWith('--')) {
        continue;
      }
      positional.push(arg);
    }

    const command = positional.shift();
    const param = positional.shift() ?? null;
    const param2 = positional.shift() ?? null;

    try {
      switch (command) {
        case 'save':
          await this.save(param, options);
          break;
        case 'restore':
          await this.restore(param, options);
          break;
        case 'select':
          await this.selectiveRestore(param, options);
          break;
        case 'list':
          this.listProfiles();
          break;
        case 'diff':
          if (!param || !param2) {
            console.error(`${this.colors.red}错误: diff 命令需要两个配置名称${this.colors.reset}`);
          } else {
            this.diff(param, param2);
          }
          break;
        case 'delete':
          if (!param) {
            console.error(`${this.colors.red}错误: 请指定要删除的配置名称${this.colors.reset}`);
          } else {
            this.deleteProfile(param);
          }
          break;
        case 'help':
        case '-h':
        case '--help':
          this.showHelp();
          break;
        case undefined:
          this.showHelp();
          break;
        default:
          console.error(`${this.colors.red}未知命令: ${command}${this.colors.reset}`);
          this.showHelp();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${this.colors.red}运行出错:${this.colors.reset}`, message);
      this.clearLock();
      process.exit(1);
    }
  }
}

export { NpmMigrate };
export default NpmMigrate;
