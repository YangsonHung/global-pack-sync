# Contributing to Global Pack Sync

Thanks for your interest in improving Global Pack Sync! This guide explains how to get set up, make changes, and submit contributions that align with the project's practices.

## Getting Started

- Make sure you have a recent LTS release of Node.js and Yarn installed.
- Fork the repository (or create a feature branch if you have direct access) before you start working.
- Install dependencies: `yarn install`.

## Development Workflow

1. Create a branch named after the feature or fix you are implementing.
2. Make focused changes inside `src/` and add or update tests in `tests/`.
3. Run `yarn build` to compile TypeScript to `dist/`. Never edit files directly under `dist/`.
4. Execute `yarn test` to run the Vitest suite with coverage before opening a pull request.
5. Re-run the build to ensure generated declarations stay in sync with your changes.

## Coding Standards

- TypeScript is written in strict mode. Exported APIs must use explicit types.
- Follow the existing 2-space indentation and keep files ASCII unless Unicode is required for user-facing output.
- Use PascalCase for exported classes/functions, camelCase for variables/modules, and kebab-case for CLI filenames.
- Avoid duplicate configuration and share settings through `package.json`, `tsconfig.json`, and `vitest.config.ts` when needed.

## Testing Expectations

- Add deterministic Vitest suites under `tests/**/*.test.ts`. Name suites after the class or method under test.
- Cover both success and failure paths. Use `vi.spyOn` when you need to assert command execution.
- Use temporary directories for filesystem effects to avoid polluting the workspace.
- Ensure `yarn test` passes locally before submitting your work.

## Commit & Pull Request Guidelines

- Follow Conventional Commit prefixes (e.g., `feat`, `fix`, `docs`) as seen in the repository history.
- Keep commits focused. Avoid mixing formatting-only changes with functional updates.
- Describe the scope of your pull request, link related issues, and include testing notes (for example, `yarn test`). Add screenshots or logs if behavior or output changes.

## Code Review Checklist

Before you open a pull request, verify:

- [ ] All TypeScript compiles (`yarn build`).
- [ ] Tests pass (`yarn test`).
- [ ] New or updated tests cover your changes.
- [ ] Documentation (README or others) reflects user-facing changes.
- [ ] Commit messages use the Conventional Commit style.

Thank you for helping make Global Pack Sync better!
