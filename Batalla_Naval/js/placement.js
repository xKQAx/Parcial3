import { BOARD_SIZE, CELL, ORIENTATION } from "./config.js";
import { inBounds } from "./board.js";

/**
 * Resuelve las celdas ocupadas por un barco desde la celda inicial.
 * @param {"horizontal"|"vertical"} orientation
 */
export function getShipCells(row, col, length, orientation) {
  const cells = [];
  if (orientation === ORIENTATION.HORIZONTAL) {
    for (let c = col; c < col + length; c++) cells.push([row, c]);
  } else {
    for (let r = row; r < row + length; r++) cells.push([r, col]);
  }
  return cells;
}

export function canPlaceShip(board, row, col, length, orientation) {
  const cells = getShipCells(row, col, length, orientation);
  for (const [r, c] of cells) {
    if (!inBounds(r, c)) return false;
    if (board[r][c] === CELL.SHIP) return false;
  }
  return true;
}

export function placeShip(board, row, col, length, orientation) {
  const cells = getShipCells(row, col, length, orientation);
  for (const [r, c] of cells) board[r][c] = CELL.SHIP;
}

/** Máximo de intentos aleatorios por barco antes de fallar (evita recursión infinita). */
const MAX_PLACE_ATTEMPTS = 800;

/**
 * Coloca la flota del PC en orden por tipo, igual que el juego original.
 * @param {string[][]} board
 * @param {ReadonlyArray<{ length: number, count: number }>} fleetByType
 * @returns {Array<{ typeIndex: number, length: number, orientation: string, cells: Array<[number, number]> }>}
 *   Lista de barcos colocados con sus celdas (necesario para detectar hundimientos
 *   y revelar posiciones al terminar la partida).
 */
export function placeFleetRandom(board, fleetByType) {
  const placed = [];
  for (let typeIndex = 0; typeIndex < fleetByType.length; typeIndex++) {
    const { length, count } = fleetByType[typeIndex];
    for (let n = 0; n < count; n++) {
      let done = false;
      for (let attempt = 0; attempt < MAX_PLACE_ATTEMPTS && !done; attempt++) {
        const orientation =
          Math.random() < 0.5 ? ORIENTATION.HORIZONTAL : ORIENTATION.VERTICAL;
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        if (canPlaceShip(board, row, col, length, orientation)) {
          placeShip(board, row, col, length, orientation);
          placed.push({
            typeIndex,
            length,
            orientation,
            cells: getShipCells(row, col, length, orientation),
          });
          done = true;
        }
      }
      if (!done) {
        throw new Error(
          "No se pudo colocar todos los barcos del PC; intente de nuevo."
        );
      }
    }
  }
  return placed;
}
