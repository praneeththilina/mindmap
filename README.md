# MindMap Studio (Vite + Vanilla JS)

A responsive, touch-friendly mind map app designed for practical usage on desktop, mobile, and Capacitor Android wrappers.

## Features

- Tree-based topic management: create child/sibling/floating topics, drag positioning, subtree deletion/duplication, branch collapse, and balanced mind-map layout.
- Productive editing: label, notes, color, priority/progress markers, search highlight, focus mode, and branch collapse.
- View controls: pan canvas, wheel zoom, zoom buttons, and fit-to-view.
- Productivity helpers: undo/redo history and keyboard shortcuts.
- Data safety: localStorage persistence, JSON + Markdown import/export, import validation, and relationship-link persistence.
- Responsive UI with mobile-safe touch behavior and safe-area handling.
- Templates gallery and command palette for fast map operations.
- Relationship mode for non-tree links between topics (XMind-style).

## Keyboard shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`: Redo
- `Tab`: Add child node
- `Enter`: Add sibling node
- `Space`: Collapse/expand selected branch
- `Arrow keys`: Navigate parent/child/sibling nodes
- `Ctrl/Cmd + D`: Duplicate selected subtree
- `Ctrl/Cmd + K`: Open command palette
- `F`: Toggle focus mode for selected subtree
- `R`: Toggle relationship mode
- `Delete`: Delete selected non-root node

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## GitHub workflow (web build)

This repo includes `.github/workflows/web-build.yml`:

- Runs on pushes, pull requests, and manual triggers.
- Installs dependencies via `npm install` and disables setup-node package-manager cache to avoid lockfile checks.
- Installs dependencies via `npm ci`.
- Builds via `npm run build`.
- Uploads `dist` as a CI artifact (`web-dist`).


## GitHub Pages deployment

This repo includes `.github/workflows/deploy-pages.yml` to deploy the Vite app to GitHub Pages.

- Runs on pushes to `main` and manual dispatch.
- Detects the correct Vite base path automatically:
  - `/<repo>/` for project pages
  - `/` for `<user>.github.io` repos
- Builds with `npm ci && npm run build`.
- Publishes `dist/` via the official Pages actions.

## Capacitor integration notes

This app is frontend-only and suitable for Capacitor Android integration.

Typical steps:

1. Build assets: `npm run build`
2. Initialize Capacitor: `npx cap init`
3. Add Android platform: `npx cap add android`
4. Sync assets: `npx cap sync android`
5. Open Android Studio: `npx cap open android`
