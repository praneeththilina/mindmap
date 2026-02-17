# MindMap Studio (Vite + Vanilla JS)

A responsive, touch-friendly mind map app built for practical daily use.

## Features

- Create, connect, edit, and delete nodes.
- Add child and sibling nodes quickly.
- Drag-and-drop node placement with auto-layout (left-right or top-bottom).
- Node editor with title, notes, and color.
- Persist map data in local storage.
- Import/export maps as JSON files.
- Responsive layout for desktop and mobile screens.
- Capacitor-friendly architecture (frontend-only, no backend dependency).

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Capacitor integration notes

This app is already suitable for a Capacitor Android shell because it is fully client-side.

Typical next steps:

1. Build web assets: `npm run build`
2. Initialize Capacitor: `npx cap init`
3. Add Android platform: `npx cap add android`
4. Sync assets: `npx cap sync android`
5. Open Android Studio: `npx cap open android`

