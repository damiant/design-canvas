import "./style.css";
import { createBoard } from "./board";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

const mount = document.querySelector<HTMLDivElement>("#app")!;
const board = createBoard(mount);

export { board };

export function mountReact(
  element: ReactElement,
  options: { x: number; y: number },
): void {
  const container = document.createElement("div");
  createRoot(container).render(element);
  board.add(container, options);
}
