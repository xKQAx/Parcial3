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
 */
export function placeFleetRandom(board, fleetByType) {
  for (let typeIndex = 0; typeIndex < fleetByType.length; typeIndex++) {
    const { length, count } = fleetByType[typeIndex];
    for (let n = 0; n < count; n++) {
      let placed = false;
      for (let attempt = 0; attempt < MAX_PLACE_ATTEMPTS && !placed; attempt++) {
        const orientation =
          Math.random() < 0.5 ? ORIENTATION.HORIZONTAL : ORIENTATION.VERTICAL;
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        if (canPlaceShip(board, row, col, length, orientation)) {
          placeShip(board, row, col, length, orientation);
          placed = true;
        }
      }
      if (!placed) {
        throw new Error(
          "No se pudo colocar todos los barcos del PC; intente de nuevo."
        );
      }
    }
  }
}
