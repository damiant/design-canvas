import { createContainer, type BoardContainerHandle } from "./container";
import type { ContainerOptions } from "./types";

export interface Board {
  element: HTMLElement;
  add(content: HTMLElement, opts: ContainerOptions): BoardContainerHandle;
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

  return {
    element,
    add(content, opts) {
      const handle = createContainer(content, opts);
      world.appendChild(handle.element);
      return handle;
    },
    destroy() {
      element.remove();
    },
  };
}
