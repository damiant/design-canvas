# Design Board

This project is an infinite board that will display components built by the user:

- Use the orchestrator subagent to breakup work (particularing implementing multiple screens/components/ui) into tasks
- **Always place new components on the board.** When the user asks for a new component, build the component in its own file outside `src/board/`, then mount it onto the board via `board.add(element, { x, y })` from `src/main.ts`. Never render a component directly into `#app` or anywhere else — every component the user sees must live inside a `BoardContainer` on the board.
- When asked to create a component do not add border radius and shadows around these.
- When asked to create a page, site, screen or UI treat this as a component to create.
- **Do not introduce routing or pages.** This project is a single-surface board, not a multi-page app. Never add a router (e.g. `react-router`, `vue-router`, `@tanstack/router`), never create a `pages/` or `routes/` directory, never replace the board with a page layout, navigation bar, or layout shell. The board is the entire application; everything else is a component placed on it.
- **Modify components, not the board.** When the user asks to change behavior, styling, or content, the change belongs in the component file under `src/` (outside `src/board/`). Do not edit any file in `src/board/` to satisfy a component-level request — the board (panning, container dragging, the 8px transparent border, the grid background, the world transform, the public API) is fixed infrastructure. Only touch `src/board/` if the user explicitly asks to change the board itself.
- **Keep the board independent of components.** `src/board/` must not import from anywhere else in `src/`. Components are passed in as plain `HTMLElement`s; the board never knows what's inside a container.

## How to Install, Build and Test

This project uses **Vite+** (CLI: `vp`). Common commands:

- Install: `vp install`
- Dev server: `vp dev`
- Build: `vp build`
- Validate: `vp check` and `vp test`

Do not invoke `npm`/`pnpm`/`yarn`/`vite`/`vitest` directly — always go through `vp`.

For anything else related to Vite+ (commands, dependency management, imports from `vite-plus`, CI, gotchas), consult the **`vite-plus` skill** at `.builder/skills/vite-plus/SKILL.md`.
