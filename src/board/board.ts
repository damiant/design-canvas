import { createContainer, type BoardContainerHandle } from "./container";
import type { ContainerOptions } from "./types";

/** Minimum gap (in world px) kept between auto-placed containers. */
const MIN_DISTANCE = 100;

export interface Board {
  element: HTMLElement;
  add(content: HTMLElement, opts?: ContainerOptions): BoardContainerHandle;
  destroy(): void;
}

export function createBoard(mount: HTMLElement): Board {
  const element = document.createElement("div");
  element.className = "board";

  const world = document.createElement("div");
  world.className = "board-world";
  element.appendChild(world);

  let panX = 0;
  let panY = 0;

  const applyPan = () => {
    world.style.transform = `translate(${panX}px, ${panY}px)`;
    element.style.backgroundPosition = `${panX}px ${panY}px`;
  };
  applyPan();

  let panStart: { px: number; py: number; ox: number; oy: number } | null =
    null;

  const onPointerDown = (e: PointerEvent) => {
    // Only pan when the background of the board is the drag origin.
    if (e.target !== element && e.target !== world) return;
    panStart = { px: e.clientX, py: e.clientY, ox: panX, oy: panY };
    element.setPointerCapture(e.pointerId);
    element.classList.add("is-panning");
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!panStart) return;
    panX = panStart.ox + (e.clientX - panStart.px);
    panY = panStart.oy + (e.clientY - panStart.py);
    applyPan();
  };

  const endPan = (e: PointerEvent) => {
    if (!panStart) return;
    panStart = null;
    if (element.hasPointerCapture(e.pointerId)) {
      element.releasePointerCapture(e.pointerId);
    }
    element.classList.remove("is-panning");
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", endPan);
  element.addEventListener("pointercancel", endPan);

  mount.appendChild(element);

  const placedHandles: BoardContainerHandle[] = [];

  /**
   * Find a free spot in world coordinates that keeps the new container's
   * bounding box at least MIN_DISTANCE away from every existing container.
   * Searches outward in a square spiral around the viewport center so that
   * auto-placed components stay near where the user is currently looking.
   */
  const findFreeSpot = (width: number, height: number): { x: number; y: number } => {
    const viewW = element.clientWidth || window.innerWidth;
    const viewH = element.clientHeight || window.innerHeight;
    // Center of the current viewport in world coordinates.
    const centerX = -panX + viewW / 2 - width / 2;
    const centerY = -panY + viewH / 2 - height / 2;

    const existing = placedHandles.map((h) => {
      const r = h.element.getBoundingClientRect();
      // Convert client rect back to world coordinates.
      const wx = r.left - element.getBoundingClientRect().left - panX;
      const wy = r.top - element.getBoundingClientRect().top - panY;
      return { x: wx, y: wy, w: r.width, h: r.height };
    });

    const fits = (x: number, y: number) =>
      existing.every((e) => {
        // AABB-to-AABB distance: separation on each axis, then Euclidean.
        const dx = Math.max(e.x - (x + width), x - (e.x + e.w), 0);
        const dy = Math.max(e.y - (y + height), y - (e.y + e.h), 0);
        return Math.hypot(dx, dy) >= MIN_DISTANCE;
      });

    if (fits(centerX, centerY)) return { x: centerX, y: centerY };

    // Square spiral search on a coarse grid.
    const step = MIN_DISTANCE;
    for (let ring = 1; ring < 200; ring++) {
      for (let i = -ring; i <= ring; i++) {
        const candidates: Array<[number, number]> = [
          [centerX + i * step, centerY - ring * step],
          [centerX + i * step, centerY + ring * step],
          [centerX - ring * step, centerY + i * step],
          [centerX + ring * step, centerY + i * step],
        ];
        for (const [cx, cy] of candidates) {
          if (fits(cx, cy)) return { x: cx, y: cy };
        }
      }
    }
    // Fallback: stack to the right of the last placed item.
    return { x: centerX + placedHandles.length * step, y: centerY };
  };

  return {
    element,
    add(content, opts) {
      let x = opts?.x;
      let y = opts?.y;

      if (x === undefined || y === undefined) {
        // Mount off-screen first to measure intrinsic size, then place.
        content.style.visibility = "hidden";
        const probe = createContainer(content, { x: -99999, y: -99999 });
        world.appendChild(probe.element);
        const rect = probe.element.getBoundingClientRect();
        const spot = findFreeSpot(rect.width, rect.height);
        probe.remove();
        content.style.visibility = "";
        x = x ?? spot.x;
        y = y ?? spot.y;
      }

      const handle = createContainer(content, { x, y });
      world.appendChild(handle.element);
      placedHandles.push(handle);
      const originalRemove = handle.remove;
      handle.remove = () => {
        const idx = placedHandles.indexOf(handle);
        if (idx >= 0) placedHandles.splice(idx, 1);
        originalRemove.call(handle);
      };
      return handle;
    },
    destroy() {
      element.remove();
    },
  };
}
