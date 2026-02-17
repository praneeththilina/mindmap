# MindMap Studio (Vite + Vanilla JS)

A responsive, touch-friendly mind map app designed for practical usage on desktop, mobile, and Capacitor Android wrappers.

## Features

- Tree-based node management: create child/sibling nodes, drag positioning, subtree deletion.
- Productive editing: label, notes, color, search highlight, and quick selection.
- View controls: pan canvas, wheel zoom, zoom buttons, and fit-to-view.
- Productivity helpers: undo/redo history and keyboard shortcuts.
- Data safety: localStorage persistence, JSON import/export, and import validation.
- Responsive UI with mobile-safe touch behavior and safe-area handling.

## Keyboard shortcuts

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`: Redo
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

## Capacitor integration notes

This app is frontend-only and suitable for Capacitor Android integration.

Typical steps:

1. Build assets: `npm run build`
2. Initialize Capacitor: `npx cap init`
3. Add Android platform: `npx cap add android`
4. Sync assets: `npx cap sync android`
5. Open Android Studio: `npx cap open android`
