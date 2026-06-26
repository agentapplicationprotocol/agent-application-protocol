# Repository Guidelines

## Project Structure & Module Organization

This repository is a VitePress documentation site for the Agent Application Protocol. English documentation lives in `docs/*.md`; Simplified Chinese translations mirror most pages under `docs/zh/*.md`. Site configuration is in `docs/.vitepress/config.js`, with theme overrides in `docs/.vitepress/theme/`. Static assets such as logos, favicon, robots.txt, and SVGs belong in `docs/public/`.

When adding a new documentation page, update the relevant sidebar arrays in `docs/.vitepress/config.js`. For user-facing protocol docs, add or update the matching `docs/zh/` page when practical.

## Build, Test, and Development Commands

- `npm install`: install VitePress and formatting dependencies from `package-lock.json`.
- `npm run dev`: start the local VitePress dev server for `docs/`.
- `npm run build`: build the static documentation site and catch broken VitePress configuration.
- `npm run preview`: preview the production build locally.
- `npx oxfmt <files>`: format supported Markdown, code, and config files manually when needed.

There is no dedicated test suite in this repository; use `npm run build` as the primary validation step.

## Coding Style & Naming Conventions

Use Markdown for content and ES modules for VitePress configuration. Follow the existing style: concise headings, short paragraphs, fenced code blocks with language tags, and lowercase kebab-case filenames such as `tool-call.md`. Keep English and Chinese pages structurally aligned.

Formatting is handled by `oxfmt` through `lint-staged`; avoid hand-formatting churn. JavaScript files use semicolons in `config.js`.

## Testing Guidelines

Before opening a pull request, run `npm run build`. For documentation changes, also run `npm run dev` and spot-check changed pages, sidebar links, diagrams, and locale routes. Mermaid diagrams render as images, so verify them in the browser after significant edits.

## Commit & Pull Request Guidelines

Recent commits use concise conventional-style prefixes, for example `docs(schema): ...`, `docs(zh): ...`, and `chore: ...`. Prefer `docs(<area>):` for content changes and `chore:` for tooling or presentation maintenance.

Pull requests should include a clear summary, affected pages, whether translations were updated, and validation performed, especially `npm run build`. Link related issues when available. Include screenshots only for visible layout, theme, navigation, or diagram changes.

## Security & Configuration Tips

Do not commit secrets, analytics credentials beyond existing public configuration, or local environment files. Keep public assets under `docs/public/` and reference them with root-relative paths appropriate for VitePress.
