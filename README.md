# Design Canvas

An infinite, pannable design board for building and previewing UI components in isolation. Components are placed as draggable containers on a zoomable canvas, making it easy to develop and compare multiple UI pieces side by side.

## Features

- **Infinite board** — pan by dragging the background, zoom with the scroll wheel (20%–400%)
- **Draggable containers** — each component lives in its own movable container on the board
- **Auto-placement** — new components are placed near the viewport center, avoiding collisions with existing ones
- **React support** — mount React components onto the board via `mountReact`
- **Tailwind styling** — all component styling uses Tailwind utility classes with semantic design tokens

## Tech Stack

- [Vite+](https://vite.dev) (`vp`) — dev server, build, and toolchain
- [React 19](https://react.dev) — component rendering
- [TypeScript](https://www.typescriptlang.org) — type safety throughout
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first styling
- [Lucide React](https://lucide.dev) — icon library

## Getting Started

```bash
# Install dependencies
vp install

# Start the dev server
vp dev

# Build for production
vp build

# Type-check
vp check
```

## Adding Components

Components live in `src/features/{feature-name}/`. Mount them onto the board from `src/main.ts`:

```ts
import { mountReact } from "./main";
import MyComponent from "./features/my-component";

mountReact(<MyComponent />, { x: 100, y: 100 });
```

If `x`/`y` are omitted, the board auto-places the component near the current viewport center.

## Project Structure

```
src/
  board/         # Infinite board infrastructure (pan, zoom, containers)
  features/      # User-built components, one directory per feature
  main.ts        # Board initialization and mountReact helper
  style.css      # Global styles
```

> The `src/board/` directory is fixed infrastructure — component work belongs in `src/features/`.
