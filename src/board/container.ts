import type { ContainerOptions } from "./types";

export interface BoardContainerHandle {
  element: HTMLElement;
  setPosition(x: number, y: number): void;
  remove(): void;
}

export function createContainer(
  content: HTMLElement,
  opts: ContainerOptions,
): BoardContainerHandle {
  const element = document.createElement("div");
  element.className = "board-container";
  element.appendChild(content);

  let x = opts.x;
  let y = opts.y;

  const applyPosition = () => {
    element.style.transform = `translate(${x}px, ${y}px)`;
  };
  applyPosition();

  let dragStart: { px: number; py: number; ox: number; oy: number } | null =
    null;

  const onPointerDown = (e: PointerEvent) => {
    // Only react to drags initiated on the transparent border (the container
    // itself), not on the inner content. The inner content gets its own events.
    if (e.target !== element) return;
    e.stopPropagation();
    dragStart = { px: e.clientX, py: e.clientY, ox: x, oy: y };
    element.setPointerCapture(e.pointerId);
    element.classList.add("is-dragging");
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragStart) return;
    x = dragStart.ox + (e.clientX - dragStart.px);
    y = dragStart.oy + (e.clientY - dragStart.py);
    applyPosition();
  };

  const endDrag = (e: PointerEvent) => {
    if (!dragStart) return;
    dragStart = null;
    if (element.hasPointerCapture(e.pointerId)) {
      element.releasePointerCapture(e.pointerId);
    }
    element.classList.remove("is-dragging");
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", endDrag);
  element.addEventListener("pointercancel", endDrag);

  return {
    element,
    setPosition(nx, ny) {
      x = nx;
      y = ny;
      applyPosition();
    },
    remove() {
      element.remove();
    },
  };
}
