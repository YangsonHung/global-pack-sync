# Changelog

All notable changes to this project will be documented in this file.

## [0.0.3] - 2025-09-29

### Added

- Added the short `gps` alias to the published CLI binaries and help output.

### Changed

- Replaced the numeric skip prompt with an interactive selector for the `select` command, including non-TTY fallbacks.

### Docs

- Documented the new alias and selector controls in the English and Chinese READMEs.

## [0.0.2] - 2025-09-29

### Changed

- Normalized package metadata and release scripts to streamline publishing.
- Corrected the CLI bin path so npm installs resolve the compiled entry point.
- Updated README badges for npm metadata.

### Tooling

- Added Prettier formatting workflows and scripts for consistent styling.

## [0.0.1] - 2025-09-28

### Added

- Initial TypeScript CLI structure with `GlobalPackSync` implementation and CLI entry.
- Yarn-based build pipeline (`yarn build`, `yarn test`) and Vitest coverage.
- Documentation set including README (EN/zh), AGENTS guide, and MIT LICENSE.
- CHANGELOG to track future releases.
