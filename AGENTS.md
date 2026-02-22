# AGENTS.md - MindMap Studio Development Guide

## Project Overview

MindMap Studio is a responsive, touch-friendly mind map application built with React 19, Vite, TailwindCSS 4, and Capacitor for Android. Entry point is `src/main.jsx`.

## Build Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Capacitor commands (for Android)
npm run cap:sync     # Sync web assets to Android
npm run cap:open     # Open Android Studio
npm run cap:build    # Build + sync to Android
```

**Note:** There are currently no tests configured for this project. Do not add tests unless explicitly requested.

## Code Style Guidelines

### General Principles

- Write clean, modern React with functional components and hooks
- Use TypeScript for new files (.tsx) - it's in devDependencies
- Keep components small and focused on single responsibilities
- Handle errors gracefully with try/catch and error boundaries

### React Conventions

```jsx
// Good: functional component with destructured props
function Node({ id, label, color, onSelect }) {
  return (
    <div 
      className="node active" 
      style={{ background: color }}
      onClick={() => onSelect(id)}
    >
      {label}
    </div>
  );
}

// Good: custom hook for stateful logic
function useMindMap() {
  const [nodes, setNodes] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const addNode = useCallback((parentId) => {
    // ...
  }, []);
  
  return { nodes, selected, addNode };
}

// Good: early returns
function findNode(id) {
  if (!id) return null;
  return nodes.find(n => n.id === id);
}
```

### Naming Conventions

- **Components**: PascalCase (e.g., `NodeEditor`, `MindMapCanvas`)
- **Hooks**: camelCase with `use` prefix (e.g., `useHistory`, `useTheme`)
- **Props**: camelCase (e.g., `onSelect`, `nodeColor`)
- **CSS classes**: Tailwind kebab-case (e.g., `bg-primary`, `text-center`)
- **Files**: PascalCase for components (e.g., `NodeEditor.jsx`), camelCase for hooks/utilities

### State Management

- Use `useState` for local component state
- Use `useContext` for global state (theme, user preferences)
- Use `useReducer` for complex state with multiple actions
- Memoize expensive computations with `useMemo` and `useCallback`

### Event Handling

```jsx
// Good: handler defined outside JSX
const handleNodeClick = useCallback((nodeId) => {
  setSelected(nodeId);
}, []);

return <Node onSelect={handleNodeClick} />;

// Good: inline for simple cases
<button onClick={() => setCount(c => c + 1)}>+</button>
```

### Error Handling

```jsx
// Wrap async operations in try/catch
async function saveMap(data) {
  try {
    await storage.set(KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save:', error);
    setError('Failed to save map');
  }
}

// Error boundary component for catching render errors
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }
  render() { return this.props.children; }
}
```

### CSS/Tailwind Guidelines

- Use Tailwind utility classes for all styling
- Use `@apply` sparingly in CSS - prefer utility classes in JSX
- Tailwind v4 uses CSS-based configuration (no tailwind.config.js needed)
- Dark mode via `dark:` modifier: `dark:bg-slate-800`
- Use existing color palette from tailwind.config.js

### Dark Mode Implementation

```jsx
// Body should have dark class when dark mode is active
<body className={theme === 'dark' ? 'dark' : ''}>
  {/* Use dark: modifier */}
  <div className="bg-white dark:bg-slate-800">
```

### Import Order

```jsx
// 1. React imports
import React, { useState, useCallback } from 'react';

// 2. External libraries
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

// 3. Internal components/hooks
import Node from './Node';
import { useMindMap } from '../hooks';

// 4. Types (TypeScript only)
import type { Node as NodeType } from '../types';
```

### File Organization

```
src/
├── main.jsx           # React entry point
├── App.jsx            # Root component
├── index.css          # Global styles (Tailwind imports)
├── components/        # Reusable UI components
│   ├── Node.jsx
│   ├── Canvas.jsx
│   └── Toolbar.jsx
├── hooks/             # Custom React hooks
│   ├── useMindMap.js
│   └── useHistory.js
├── context/           # React Context providers
│   └── ThemeContext.jsx
├── utils/             # Pure utility functions
│   └── storage.js
└── types/             # TypeScript type definitions
    └── index.ts
```

### TypeScript Guidelines

- Use `.tsx` extension for components with JSX
- Define interfaces for props and state
- Avoid `any` - use `unknown` when type is truly unknown
- Use generic types for reusable hooks

```tsx
interface NodeProps {
  id: string;
  label: string;
  color: string;
  onSelect: (id: string) => void;
}

function Node({ id, label, color, onSelect }: NodeProps) {
  // ...
}
```

### Performance Tips

- Memoize child components with `React.memo` to prevent unnecessary re-renders
- Use `useCallback` for event handlers passed to children
- Lazy load routes with `React.lazy()` and `Suspense`
- Debounce search input handlers

### Accessibility

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Include `alt` props on images
- Use `aria-label` for icon-only buttons
- Support keyboard navigation

## Git Workflow

- Create feature branches from `main`
- Commit frequently with clear messages
- Do not commit `node_modules/`, `dist/`, or generated files
- Keep `.gitignore` patterns from existing repository

## Capacitor Notes

- This app is frontend-only, suitable for Capacitor Android integration
- Build web assets first (`npm run build`), then sync to Android
- Android config in `android/` directory after `npx cap init`
