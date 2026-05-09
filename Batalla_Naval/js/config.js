/**
 * Constantes centralizadas del juego (tablero, flota, fases).
 * Los valores de celda coinciden con el juego original para mantener compatibilidad con CSS.
 */
export const BOARD_SIZE = 10;

export const CELL = Object.freeze({
  EMPTY: "",
  SHIP: "ship",
  HIT: "hit",
  MISS: "miss",
});

/** Definición de la flota por tipo (índice = selector en UI). */
export const FLEET_BY_TYPE = Object.freeze([
  { id: 0, name: "Portaviones", length: 5, count: 1 },
  { id: 1, name: "Acorazado", length: 4, count: 1 },
  { id: 2, name: "Submarino", length: 3, count: 1 },
  { id: 3, name: "Destructor", length: 2, count: 2 },
]);

export const ORIENTATION = Object.freeze({
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
});

export const GAME_PHASE = Object.freeze({
  WELCOME: "welcome",
  PLACING: "placing",
  BATTLE: "battle",
  ENDED: "ended",
});

export const OWNER = Object.freeze({
  PLAYER: "player",
  PC: "pc",
});
