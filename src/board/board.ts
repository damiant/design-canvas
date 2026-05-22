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

  const STORAGE_KEY = "board-viewport";
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 4;
  const GRID_SIZE = 100;

  const saved = (() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  let panX: number = saved?.panX ?? 0;
  let panY: number = saved?.panY ?? 0;
  let zoom: number = saved?.zoom ?? 1;

  const zoomIndicator = document.createElement("button");
  zoomIndicator.type = "button";
  zoomIndicator.className = "board-zoom-indicator";
  zoomIndicator.hidden = true;
  zoomIndicator.title = "Reset zoom to 100%";
  zoomIndicator.addEventListener("click", () => {
    zoom = 1;
    applyTransform();
  });
  element.appendChild(zoomIndicator);

  const applyTransform = () => {
    const rpx = Math.round(panX);
    const rpy = Math.round(panY);
    world.style.transform = `translate3d(${rpx}px, ${rpy}px, 0) scale(${zoom})`;
    const size = GRID_SIZE * zoom;
    element.style.backgroundSize = `${size}px ${size}px`;
    element.style.backgroundPosition = `${Math.round(panX)}px ${Math.round(panY)}px`;
    if (zoom === 1) {
      zoomIndicator.hidden = true;
    } else {
      zoomIndicator.hidden = false;
      zoomIndicator.textContent = `${Math.round(zoom * 100)}%`;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ panX, panY, zoom }));
    } catch {
      // sessionStorage unavailable — silently skip
    }
  };
  const applyPan = applyTransform;
  applyTransform();

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = element.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    // World point under cursor before zoom.
    const wx = (cx - panX) / zoom;
    const wy = (cy - panY) / zoom;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
    if (newZoom === zoom) return;
    zoom = newZoom;
    // Keep the same world point under the cursor after zoom.
    panX = cx - wx * zoom;
    panY = cy - wy * zoom;
    applyTransform();
  };
  element.addEventListener("wheel", onWheel, { passive: false });

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
    const centerX = (viewW / 2 - panX) / zoom - width / 2;
    const centerY = (viewH / 2 - panY) / zoom - height / 2;

    const boardRect = element.getBoundingClientRect();
    const existing = placedHandles.map((h) => {
      const r = h.element.getBoundingClientRect();
      // Convert client rect back to world coordinates.
      const wx = (r.left - boardRect.left - panX) / zoom;
      const wy = (r.top - boardRect.top - panY) / zoom;
      return { x: wx, y: wy, w: r.width / zoom, h: r.height / zoom };
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
        const probe = createContainer(content, { x: -99999, y: -99999 }, () => zoom);
        world.appendChild(probe.element);
        const rect = probe.element.getBoundingClientRect();
        const spot = findFreeSpot(rect.width / zoom, rect.height / zoom);
        probe.remove();
        content.style.visibility = "";
        x = x ?? spot.x;
        y = y ?? spot.y;
      }

      const handle = createContainer(content, { x, y }, () => zoom);
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
