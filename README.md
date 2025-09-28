# npm-migrate

[中文文档](./README.zh.md)


CLI utility for backing up and restoring globally installed npm, Yarn, and pnpm packages when switching Node.js versions.

## Features
- Save the current global package list with metadata about Node/npm versions and platform.
- Restore packages in parallel using the latest versions or the exact saved versions.
- Selective restore mode with an interactive prompt for skipping packages.
- Compare (diff) two saved profiles and clean up profiles you no longer need.
- Automatically skips core tooling packages (npm, corepack, npm-migrate, etc.) and generates retry scripts for failures.

## Installation

```bash
# Install globally with npm
npm install -g npm-migrate

# or with Yarn
yarn global add npm-migrate

# or with pnpm
pnpm add -g npm-migrate
```

## Quick Start

```bash
# Save the current environment
npm-migrate save my-global-packages

# Switch Node.js versions
nvm use 18

# Restore packages (defaults to latest versions)
npm-migrate restore my-global-packages

# Restore using exact saved versions
npm-migrate restore my-global-packages --exact-version
```

## Commands
- `save [name]` – capture the current global packages into a profile.
- `restore [name]` – restore packages from a saved profile.
- `select [name]` – interactively restore selected packages.
- `list` – show all saved profiles.
- `diff <name1> <name2>` – compare two profiles.
- `delete <name>` – remove a saved profile.
- `help` – print CLI usage.

### Options
- `--pm <manager>` – choose npm, yarn, or pnpm explicitly.
- `--concurrency <n>` – number of concurrent installs (default 3).
- `--exact-version` – install the exact versions saved in the profile.

## Tests

```bash
yarn test
```

## License

MIT © 2023-present YangsonHung


