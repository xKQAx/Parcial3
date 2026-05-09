import { CELL } from "./config.js";

/** True si no queda ningún barco sin hundir (no quedan celdas SHIP). */
export function isFleetDestroyed(board) {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === CELL.SHIP) return false;
    }
  }
  return true;
}

export function isAlreadyShot(board, row, col) {
  const v = board[row][col];
  return v === CELL.HIT || v === CELL.MISS;
}
