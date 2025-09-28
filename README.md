# global-pack-sync

[中文文档](./README.zh.md)

🚀 Global npm package migration tool – effortlessly migrate the global packages you rely on when switching Node.js versions.

[![npm version](https://badge.fury.io/js/global-pack-sync.svg)](https://www.npmjs.com/package/global-pack-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Background

Switching Node.js versions is common, but it brings recurring headaches:

- 🔄 Frequent Node.js upgrades mean re-testing every toolchain.
- 📦 Globally installed CLIs vanish after a version switch.
- ⏰ Reinstalling dozens of tools manually is tedious and error-prone.
- 🔧 Different package managers (npm/yarn/pnpm) keep separate global stores.

**global-pack-sync** exists to remove that friction.

## Features

✨ **Smart version management**

- 🆕 Installs the latest releases by default to avoid security issues.
- 🔒 Lock to the exact versions captured in a snapshot when required.
- 📊 See version changes clearly before you apply them.

⚡ **High-performance installs**

- 🚀 Parallel installation dramatically accelerates migrations.
- 🎯 Skips packages that already exist globally.
- 🔄 Generates retry scripts automatically if installs fail.

🛠 **Multi package-manager support**

- 📦 Works with npm, yarn, and pnpm.
- 🔍 Auto-detects the manager in use.
- 🔧 Override the manager explicitly when needed.

🎨 **Improved developer experience**

- 🌈 Colorful terminal output with clear progress updates.
- 📋 Detailed status messages during save and restore operations.
- 🔍 Interactive selective restore for partial migrations.
- 📊 Diff saved profiles to compare environments quickly.

🛡 **Safe and stable**

- 🔒 Process lock prevents concurrent runs from clashing.
- 🚫 Filters out core packages (npm, corepack, global-pack-sync, etc.).
- 💾 Automatically backs up the configuration file before overwriting.

## Installation

```bash
# Install globally with npm
npm install -g global-pack-sync

# Or with yarn
yarn global add global-pack-sync

# Or with pnpm
pnpm add -g global-pack-sync
```

## Quick Start

### Typical workflow

```bash
# 1. Save the current global packages
global-pack-sync save

# 2. Switch to a different Node.js version
nvm use 18.0.0  # or n 18.0.0

# 3. Restore global packages in the new environment (latest versions by default)
global-pack-sync restore
```

That's it! 🎉

## Command details

### 📥 Save profiles

```bash
# Capture the current global package list
global-pack-sync save

# Save to a named profile
global-pack-sync save my-project-packages

# Detailed output example
✓ Saved profile "node-v18.17.0-1693123456789"
  Node version: v18.17.0
  npm version: 9.6.7
  Package manager: npm
  Package count: 15
  Saved at: ~/.global-pack-sync/packages.json
```

### 📤 Restore profiles

```bash
# Restore the most recent profile (installs latest versions)
global-pack-sync restore

# Restore a specific profile
global-pack-sync restore my-project-packages

# Use the exact versions captured previously
global-pack-sync restore --exact-version

# Specify manager and concurrency
global-pack-sync restore --pm yarn --concurrency 5
```

### 🎯 Selective restore

Need only part of the toolchain? Use the interactive selector:

```bash
global-pack-sync select

# Sample prompt:
Select packages to restore (profile: node-v18.17.0-1693123456789):

Package list:
  1. @vue/cli@5.0.8
  2. create-react-app@5.0.1
  3. typescript@5.2.2
  4. nodemon@3.0.1
  5. pm2@5.3.0

Enter package numbers to skip (space separated, press Enter to install all):
2 4    # skip create-react-app and nodemon

Installing 3 packages
```

You can also inspect the generated profile file for a machine-readable view:

```json
{
    "my-project-packages": {
        "nodeVersion": "v18.17.0",
        "npmVersion": "9.6.7",
        "packageManager": "npm",
        "packages": {
            "@vue/cli": "5.0.8",
            "typescript": "5.2.2"
        },
        "savedAt": "2025-08-27T10:30:56.789Z",
        "packagesCount": 15,
        "platform": "darwin",
        "arch": "x64"
    }
}
```

## FAQ

### Q: Why install the latest versions instead of the saved ones?

A: Latest releases usually include security and bug fixes. When you must pin exact versions, pass `--exact-version`.

### Q: Which packages are ignored automatically?

A: The tool skips core utilities to avoid conflicts:

- `npm`, `npx` – npm core tools
- `corepack` – Node.js built-in package manager
- `node-gyp` – typically auto-installed as part of builds
- `global-pack-sync` – the CLI itself

### Q: How do I handle failed installs?

A: A retry script (`~/.global-pack-sync/retry-failed.sh`) is generated. Run it manually or tweak and retry.

### Q: Does it respect private npm registries?

A: Yes. It uses your current npm configuration, including auth tokens and custom registries.

### Q: Can I migrate across operating systems?

A: Most packages work fine. Packages with native modules may need recompilation. Platform information is stored for reference.

## Troubleshooting

### Permission issues

```bash
# macOS/Linux
sudo global-pack-sync restore

# Or repair npm permissions
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
```

### Network issues

```bash
# Point npm to a mirror
npm config set registry https://registry.npmmirror.com

# Or fall back to npm temporarily
global-pack-sync restore --pm npm
```

### Cleanup and reset

```bash
# Remove saved profiles
rm -rf ~/.global-pack-sync

# Start fresh
global-pack-sync save
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Local development

```bash
# Clone the repo
git clone https://github.com/your-username/global-pack-sync.git
cd global-pack-sync

# Install dependencies
yarn install

# Build once (outputs to dist/)
yarn build

# Run the CLI locally
node dist/cli.js --help

# Run tests
yarn test
```

## Changelog

### v2.0.0 (latest)

- ✨ Added selective restore mode
- 🆕 Default to latest versions for better security
- 🚀 Parallel installation boosts performance
- 📊 Added profile diffing support
- 🛠 Added yarn/pnpm support
- 🔒 Added process locking to prevent conflicts

### v1.0.0

- 🎉 Initial release
- 📦 Basic save/restore workflow
- 💾 JSON-based configuration storage

See [CHANGELOG.md](./CHANGELOG.md) for the full history.

## License

[MIT License](./LICENSE) © 2025

## Links

- 🏠 [Project homepage](https://github.com/your-username/global-pack-sync)
- 🐛 [Issue tracker](https://github.com/your-username/global-pack-sync/issues)
- 📖 [Wiki](https://github.com/your-username/global-pack-sync/wiki)
- 💬 [Discussions](https://github.com/your-username/global-pack-sync/discussions)

---

If this tool helps you, please leave us a ⭐ star!

**Happy coding!** 🎉

