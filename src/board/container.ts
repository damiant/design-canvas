import type { ContainerOptions } from "./types";

export interface BoardContainerHandle {
  element: HTMLElement;
  setPosition(x: number, y: number): void;
  remove(): void;
}

export function createContainer(
  content: HTMLElement,
  opts: ContainerOptions,
  getZoom: () => number = () => 1,
): BoardContainerHandle {
  const element = document.createElement("div");
  element.className = "board-container";

  if (opts.name) {
    const label = document.createElement("span");
    label.className = "board-container-label";
    label.textContent = opts.name;
    element.appendChild(label);
  }

  element.appendChild(content);

  let x = opts.x ?? 0;
  let y = opts.y ?? 0;

  const applyPosition = () => {
    element.style.transform = `translate(${x}px, ${y}px)`;
  };
  applyPosition();

  let dragStart: { px: number; py: number; ox: number; oy: number } | null =
    null;

  const onPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    dragStart = { px: e.clientX, py: e.clientY, ox: x, oy: y };
    element.setPointerCapture(e.pointerId);
    element.classList.add("is-dragging");
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragStart) return;
    const z = getZoom() || 1;
    x = dragStart.ox + (e.clientX - dragStart.px) / z;
    y = dragStart.oy + (e.clientY - dragStart.py) / z;
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
