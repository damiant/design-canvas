# Design Board

This project is an infinite board that will display components built by the user:

- Use the orchestrator subagent to breakup work (particularing implementing multiple screens/components/ui) into tasks
- **Always place new components on the board.** When the user asks for a new component, build the component in its own file outside `src/board/`, then mount it onto the board via `board.add(element, { x, y })` from `src/main.ts`. Never render a component directly into `#app` or anywhere else — every component the user sees must live inside a `BoardContainer` on the board.
- When asked to create a component do not add border radius and shadows around these.
- When asked to create a page, site, screen or UI treat this as a component to create.
- **Do not introduce routing or pages.** This project is a single-surface board, not a multi-page app. Never add a router (e.g. `react-router`, `vue-router`, `@tanstack/router`), never create a `pages/` or `routes/` directory, never replace the board with a page layout, navigation bar, or layout shell. The board is the entire application; everything else is a component placed on it.
- **Modify components, not the board.** When the user asks to change behavior, styling, or content, the change belongs in the component file under `src/` (outside `src/board/`). Do not edit any file in `src/board/` to satisfy a component-level request — the board (panning, container dragging, the 8px transparent border, the grid background, the world transform, the public API) is fixed infrastructure. Only touch `src/board/` if the user explicitly asks to change the board itself.
- **Keep the board independent of components.** `src/board/` must not import from anywhere else in `src/`. Components are passed in as plain `HTMLElement`s; the board never knows what's inside a container.

## Component Coding Conventions

### File Structure

- Each feature lives in `src/features/{feature-name}/`
- One component per file, named after the component (e.g. `Header.tsx`, `ProductCard.tsx`)
- `index.tsx` is the feature root — it composes sub-components and mounts via `mountReact`
- Mount onto the board from `src/main.ts` using `mountReact(element, { x, y })`

### React

- Use React functional components with TypeScript (`.tsx`)
- Follow React best practices: hooks at the top level, single responsibility per component, props typed with interfaces
- Never use class components

### Styling — Tailwind Only

- Use Tailwind utility classes exclusively — no inline `style` props, no hardcoded values, no new CSS files per component
- All spacing and sizing must use token-named classes: `p-xs`, `p-sm`, `p-md`, `p-lg`, `p-xlg`, `gap-sm`, `m-md`, etc.
- All colors must use semantic token classes: `text-foreground`, `bg-background`, `bg-muted`, `text-muted`, `bg-accent`, `text-accent-foreground`, `border-border`, `bg-surface`, etc.
- All font sizes must use token classes: `text-xs`, `text-sm`, `text-md`, `text-lg`, `text-xlg`
- Font family: `font-sans`
- Never hardcode colors, padding, margins, font sizes, or font families in any form

### Icons

- Use `lucide-react` for all icons — never use emojis as visual elements
- Import icons by name: `import { Search, ChevronRight } from "lucide-react"`
- Size icons with Tailwind: `w-4 h-4`, `w-5 h-5`, etc.

## How to Install, Build and Test

This project uses **Vite+** (CLI: `vp`). Common commands:

- Install: `vp install`
- Dev server: `vp dev`
- Build: `vp build`
- Validate: `vp check` and `vp test`

Do not invoke `npm`/`pnpm`/`yarn`/`vite`/`vitest` directly — always go through `vp`.

For anything else related to Vite+ (commands, dependency management, imports from `vite-plus`, CI, gotchas), consult the **`vite-plus` skill** at `.builder/skills/vite-plus/SKILL.md`.

- Keep conversation with the user brief and non technical and add jokes about the work done.
