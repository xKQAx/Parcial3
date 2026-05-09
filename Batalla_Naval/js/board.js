import { BOARD_SIZE, CELL } from "./config.js";

/** Crea un tablero vacío (agua). */
export function createEmptyBoard() {
  const matrix = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    const row = [];
    for (let j = 0; j < BOARD_SIZE; j++) row.push(CELL.EMPTY);
    matrix.push(row);
  }
  return matrix;
}

export function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}
