import { BOARD_SIZE } from "../config.js";

/** Letras para etiquetar columnas (accesibilidad). */
const COL_LETTERS = "ABCDEFGHIJ";

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
      cell.setAttribute(
        "aria-label",
        `Casilla ${COL_LETTERS[col] ?? col}${row + 1}`
      );
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

/** Quita una o varias clases de la celda (útil al retirar un barco colocado). */
export function removeCellClasses(owner, row, col, ...classNames) {
  const el = getCellElement(owner, row, col);
  if (!el || classNames.length === 0) return;
  el.classList.remove(...classNames);
}

/**
 * Marca una celda como ya disparada para impedir disparos repetidos
 * (cursor not-allowed + sin hover). La validación de juego ya existe
 * en gameRules.isAlreadyShot; esto es solo el feedback visual.
 */
export function markShot(owner, row, col) {
  addCellClass(owner, row, col, "shot");
}

/** True si la celda dada ya tiene marca de disparo (clase `shot`). */
export function isCellShot(owner, row, col) {
  const el = getCellElement(owner, row, col);
  return !!el && el.classList.contains("shot");
}

/**
 * Revela las celdas de los barcos del owner que aún no fueron golpeadas
 * (clase `ship-revealed`). Útil al terminar la partida para mostrar dónde
 * estaban los barcos no encontrados.
 * @param {string} owner
 * @param {Array<{ cells: Array<[number, number]> }>} placedShips
 */
export function revealRemainingShips(owner, placedShips) {
  if (!Array.isArray(placedShips)) return;
  for (const ship of placedShips) {
    for (const [r, c] of ship.cells) {
      const el = getCellElement(owner, r, c);
      if (!el) continue;
      if (el.classList.contains("hit") || el.classList.contains("sunk")) {
        continue;
      }
      el.classList.add("ship-revealed");
    }
  }
}
