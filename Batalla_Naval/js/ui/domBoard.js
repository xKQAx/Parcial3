import { BOARD_SIZE } from "../config.js";

/**
 * Construye la rejilla en el contenedor y opcionalmente registra el click por celda.
 * Usa data-* para localizar celdas sin depender de ids frágiles.
 */
export function createBoardGrid(container, owner, onCellClick) {
  container.replaceChildren();
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowEl = document.createElement("div");
    rowEl.className = "myRow";
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = document.createElement("div");
      cell.className = "grid";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.dataset.owner = owner;
      if (onCellClick) cell.addEventListener("click", onCellClick);
      rowEl.appendChild(cell);
    }
    container.appendChild(rowEl);
  }
}

export function getCellElement(owner, row, col) {
  return document.querySelector(
    `.grid[data-owner="${owner}"][data-row="${row}"][data-col="${col}"]`
  );
}

export function addCellClass(owner, row, col, className) {
  const el = getCellElement(owner, row, col);
  if (el) el.classList.add(className);
}

/**
 * Crea los botones horizontal/vertical por tipo de barco (misma UX que el original).
 */
export function buildShipOrientationButtons(positionContainers, onSelectShip) {
  for (let i = 0; i < positionContainers.length; i++) {
    const wrap = positionContainers[i];
    wrap.replaceChildren();

    const horizontal = document.createElement("div");
    horizontal.className = `horizontal ${i}`;
    horizontal.addEventListener("click", onSelectShip);

    const vertical = document.createElement("div");
    vertical.className = `vertical ${i}`;
    vertical.addEventListener("click", onSelectShip);

    wrap.appendChild(horizontal);
    wrap.appendChild(vertical);
  }
}
