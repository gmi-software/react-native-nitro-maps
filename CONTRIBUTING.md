# Contributing to react-native-nitro-maps

Thank you for your interest in contributing!

## Development setup

1. Install [Bun](https://bun.sh/) and Node.js 22+.
2. Clone the repository and install dependencies:

   ```bash
   bun install
   ```

3. Build the library:

   ```bash
   bun run build
   ```

4. Run the example app:

   ```bash
   bun run example start
   ```

## Scripts

| Script | Description |
| --- | --- |
| `bun run lint` | Run ESLint across the monorepo |
| `bun run typecheck` | Type-check the library package |
| `bun run build` | Build the library with react-native-builder-bob |
| `bun run nitrogen` | Run Nitrogen codegen (when specs are ready) |
| `bun run format` | Format all files with Prettier |

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated locally via Husky and on pull requests in CI.

Format:

```text
<type>[optional scope]: <description>
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

Examples:

```text
feat: add marker clustering support
fix(ios): correct viewport filter for wrapped longitudes
chore: add commitlint configuration
```

## Pull request guidelines

- Keep changes focused and well-scoped.
- Run `bun run lint`, `bun run typecheck`, and `bun run build` before opening a PR.
- Use conventional commit messages for all commits in the PR.
- Follow existing naming conventions and avoid `any` in TypeScript.
- Update documentation when changing public APIs.

## Code style

- TypeScript strict mode is enforced.
- Use Prettier for formatting (`bun run format`).
- Place imports at the top of files.
- Use exhaustive switch handling for discriminated unions.

## Reporting issues

Please use [GitHub Issues](https://github.com/YOUR_GITHUB/react-native-nitro-maps/issues) and include:

- Library version
- React Native / Expo version
- Platform (iOS / Android)
- Steps to reproduce
- Expected vs actual behavior
