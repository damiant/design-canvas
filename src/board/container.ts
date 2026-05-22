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

  // Resize handles
  type Corner = "nw" | "ne" | "sw" | "se";
  const MIN_SIZE = 50;
  let contentW = 0;
  let contentH = 0;
  let resizeInitialized = false;

  const initResize = () => {
    if (resizeInitialized) return;
    resizeInitialized = true;
    const z = getZoom() || 1;
    const rect = content.getBoundingClientRect();
    contentW = rect.width / z;
    contentH = rect.height / z;
    content.style.width = `${contentW}px`;
    content.style.height = `${contentH}px`;
    content.style.overflow = "hidden";
    const inner = content.firstElementChild as HTMLElement | null;
    if (inner) {
      inner.style.width = "100%";
      inner.style.height = "100%";
      inner.style.minWidth = "0";
      inner.style.maxWidth = "none";
      inner.style.minHeight = "0";
      inner.style.maxHeight = "none";
      inner.style.boxSizing = "border-box";
    }
  };

  for (const corner of ["nw", "ne", "sw", "se"] as Corner[]) {
    const handle = document.createElement("div");
    handle.className = "board-container-resize-handle";
    handle.dataset.corner = corner;

    let resizeStart: {
      px: number; py: number;
      ox: number; oy: number;
      ow: number; oh: number;
    } | null = null;

    handle.addEventListener("pointerdown", (e: PointerEvent) => {
      e.stopPropagation();
      initResize();
      resizeStart = { px: e.clientX, py: e.clientY, ox: x, oy: y, ow: contentW, oh: contentH };
      handle.setPointerCapture(e.pointerId);
      element.classList.add("is-resizing");
    });

    handle.addEventListener("pointermove", (e: PointerEvent) => {
      if (!resizeStart) return;
      const z = getZoom() || 1;
      const dx = (e.clientX - resizeStart.px) / z;
      const dy = (e.clientY - resizeStart.py) / z;
      let newW = resizeStart.ow;
      let newH = resizeStart.oh;
      let newX = resizeStart.ox;
      let newY = resizeStart.oy;

      switch (corner) {
        case "nw":
          newW = Math.max(MIN_SIZE, resizeStart.ow - dx);
          newH = Math.max(MIN_SIZE, resizeStart.oh - dy);
          newX = resizeStart.ox + (resizeStart.ow - newW);
          newY = resizeStart.oy + (resizeStart.oh - newH);
          break;
        case "ne":
          newW = Math.max(MIN_SIZE, resizeStart.ow + dx);
          newH = Math.max(MIN_SIZE, resizeStart.oh - dy);
          newY = resizeStart.oy + (resizeStart.oh - newH);
          break;
        case "sw":
          newW = Math.max(MIN_SIZE, resizeStart.ow - dx);
          newH = Math.max(MIN_SIZE, resizeStart.oh + dy);
          newX = resizeStart.ox + (resizeStart.ow - newW);
          break;
        case "se":
          newW = Math.max(MIN_SIZE, resizeStart.ow + dx);
          newH = Math.max(MIN_SIZE, resizeStart.oh + dy);
          break;
      }

      contentW = newW;
      contentH = newH;
      content.style.width = `${newW}px`;
      content.style.height = `${newH}px`;
      x = newX;
      y = newY;
      applyPosition();
    });

    const endResize = (e: PointerEvent) => {
      if (!resizeStart) return;
      resizeStart = null;
      if (handle.hasPointerCapture(e.pointerId)) {
        handle.releasePointerCapture(e.pointerId);
      }
      element.classList.remove("is-resizing");
    };

    handle.addEventListener("pointerup", endResize);
    handle.addEventListener("pointercancel", endResize);
    element.appendChild(handle);
  }

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
