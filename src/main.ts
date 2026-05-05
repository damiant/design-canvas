import "./style.css";
import { createBoard } from "./board";

const mount = document.querySelector<HTMLDivElement>("#app")!;
createBoard(mount);
