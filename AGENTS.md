# Repository Guidelines

## Project Structure & Module Organization

- `src/` holds the TypeScript sources. `index.ts` exposes the `GlobalPackSync` class and CLI logic, while `cli.ts` is the executable entry compiled to `dist/`.
- `tests/` contains Vitest suites; add new files with the pattern `*.test.ts`.
- `dist/` is generated output; never edit or commit changes directly—run `yarn build` instead.
- Configuration lives in `package.json`, `tsconfig.json`, and `vitest.config.ts`. Keep shared settings in these files rather than duplicating per-module config.

## Build, Test, and Development Commands

- `yarn build` (aliased to `tsc`): Compiles TypeScript in `src/` to CommonJS output plus declaration files in `dist/`.
- `yarn test`: Runs the Vitest suite once in Node mode with coverage reporting.
- `yarn test:watch`: Starts Vitest in watch mode for rapid feedback while developing.

## Coding Style & Naming Conventions

- Use TypeScript with strict mode; prefer explicit types for exported APIs. Follow 2-space indentation and keep files ASCII unless Unicode is needed for user-facing output.
- Export classes and functions in PascalCase (e.g., `GlobalPackSync`), modules and variables in camelCase. CLI files use kebab-case filenames (`cli.ts`).
- Run `yarn build` before submitting to ensure emitted declarations stay in sync; no automated formatter is configured, so keep changes focused and readable.

## Testing Guidelines

- Tests are written with Vitest (`tests/**/*.test.ts`). Name suites after the class or method under test and keep assertions deterministic.
- When adding features, cover both success and error paths. Use `vi.spyOn` for command execution mocks and temporary directories for filesystem effects.
- Run `yarn test` locally; PRs are expected to pass without relying on CI retries.

## Commit & Pull Request Guidelines

- Follow Conventional Commit prefixes (`feat`, `fix`, `docs`, etc.) as seen in the repo history, e.g., `feat: support yarn installs`.
- Each PR should describe scope, link related issues, and include testing notes (`yarn test`). Add screenshots or logs if behavior or output changes.
- Keep commits logical and scoped; avoid mixing formatting and functional changes in one commit.
