import "./style.css";
import { createBoard } from "./board";
import { createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { MobileLayout } from "./features/mobile-layout";

const mount = document.querySelector<HTMLDivElement>("#app")!;
const board = createBoard(mount);

export { board };

export function mountReact(
  element: ReactElement,
  options: { x: number; y: number },
  containerOptions?: { name?: string },
): void {
  const container = document.createElement("div");
  createRoot(container).render(element);
  board.add(container, { ...options, ...containerOptions });
}

setTimeout(() => {
  if (board.element.querySelector(".board-container")) return;
  mountReact(createElement(MobileLayout), { x: 0, y: 0 }, { name: "Example Frame" });
}, 500);
