import {
  BOARD_SIZE,
  CELL,
  FLEET_BY_TYPE,
  GAME_PHASE,
  ORIENTATION,
  OWNER,
} from "./config.js";
import { createEmptyBoard } from "./board.js";
import {
  canPlaceShip,
  placeFleetRandom,
  placeShip,
} from "./placement.js";
import { isAlreadyShot, isFleetDestroyed } from "./gameRules.js";
import {
  addCellClass,
  buildShipOrientationButtons,
  createBoardGrid,
} from "./ui/domBoard.js";

/** Sustituible en el futuro por toasts o UI no modal. */
function notify(message) {
  window.alert(message);
}

function parseShipChoice(target) {
  const parts = target.className.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const orientation = parts[0];
  const typeIndex = Number.parseInt(parts[1], 10);
  if (
    (orientation !== ORIENTATION.HORIZONTAL &&
      orientation !== ORIENTATION.VERTICAL) ||
    Number.isNaN(typeIndex)
  ) {
    return null;
  }
  return { orientation, typeIndex };
}

function init() {
  const boardEl = document.querySelector("#board");
  const boardAttackEl = document.querySelector("#boardAttack");
  const startBtn = document.querySelector("#button");
  const positionNodes = document.querySelectorAll(".position");

  const playerBoard = createEmptyBoard();
  let pcBoard = null;

  /** Copia mutable de cantidades restantes por tipo (jugador). */
  const remainingByType = FLEET_BY_TYPE.map((t) => t.count);

  let phase = GAME_PHASE.PLACING;
  /** Selección actual de colocación: orientación + tipo; tamaño viene de FLEET_BY_TYPE. */
  let placementChoice = null;

  createBoardGrid(boardEl, OWNER.PLAYER, onPlayerPlaceClick);
  buildShipOrientationButtons(positionNodes, onShipOrientationClick);

  startBtn.addEventListener("click", onStartGame);

  function onShipOrientationClick(event) {
    if (phase !== GAME_PHASE.PLACING) return;
    const parsed = parseShipChoice(event.target);
    if (!parsed) return;
    const { orientation, typeIndex } = parsed;
    const left = remainingByType[typeIndex];
    if (left <= 0) {
      notify("No te quedan barcos de ese tipo.");
      return;
    }
    placementChoice = {
      orientation,
      typeIndex,
      length: FLEET_BY_TYPE[typeIndex].length,
    };
  }

  function onPlayerPlaceClick(event) {
    if (phase !== GAME_PHASE.PLACING) return;
    if (!placementChoice) {
      notify("Selecciona orientación y tipo de barco (horizontal/vertical).");
      return;
    }
    const cell = event.target.closest(".grid");
    if (!cell || cell.dataset.owner !== OWNER.PLAYER) return;

    const row = Number.parseInt(cell.dataset.row, 10);
    const col = Number.parseInt(cell.dataset.col, 10);
    const { orientation, typeIndex, length } = placementChoice;

    if (remainingByType[typeIndex] <= 0) {
      notify("Debes seleccionar un barco disponible.");
      return;
    }

    if (!canPlaceShip(playerBoard, row, col, length, orientation)) {
      notify("Selecciona una posición válida y sin solapar otros barcos.");
      return;
    }

    placeShip(playerBoard, row, col, length, orientation);
    const cells =
      orientation === ORIENTATION.HORIZONTAL
        ? Array.from({ length }, (_, i) => [row, col + i])
        : Array.from({ length }, (_, i) => [row + i, col]);
    for (const [r, c] of cells) {
      addCellClass(OWNER.PLAYER, r, c, "selected");
    }

    remainingByType[typeIndex] -= 1;
    placementChoice = null;
  }

  function onStartGame() {
    if (phase !== GAME_PHASE.PLACING) return;

    const totalLeft = remainingByType.reduce((a, b) => a + b, 0);
    if (totalLeft > 0) {
      notify("Coloca todos tus barcos antes de empezar.");
      return;
    }

    pcBoard = createEmptyBoard();
    try {
      placeFleetRandom(
        pcBoard,
        FLEET_BY_TYPE.map((t) => ({ length: t.length, count: t.count }))
      );
    } catch (e) {
      notify(e.message || "Error al colocar la flota del PC.");
      pcBoard = null;
      return;
    }

    createBoardGrid(boardAttackEl, OWNER.PC, onPlayerShotClick);
    phase = GAME_PHASE.BATTLE;
    startBtn.disabled = true;
  }

  function onPlayerShotClick(event) {
    if (phase !== GAME_PHASE.BATTLE || !pcBoard) return;
    const cell = event.target.closest(".grid");
    if (!cell || cell.dataset.owner !== OWNER.PC) return;

    const row = Number.parseInt(cell.dataset.row, 10);
    const col = Number.parseInt(cell.dataset.col, 10);

    if (isAlreadyShot(pcBoard, row, col)) {
      notify("Ya disparaste en esa casilla.");
      return;
    }

    if (pcBoard[row][col] === CELL.SHIP) {
      notify("Muy bien, acertaste. Vuelve a jugar");
      pcBoard[row][col] = CELL.HIT;
      addCellClass(OWNER.PC, row, col, "hit");
      if (isFleetDestroyed(pcBoard)) {
        phase = GAME_PHASE.ENDED;
        notify("GANASTE!!!");
      }
      return;
    }

    notify("Mal! tu disparo cayó al agua");
    pcBoard[row][col] = CELL.MISS;
    addCellClass(OWNER.PC, row, col, "miss");
    runPcTurn();
  }

  /** Replica la lógica original: el PC repite disparo si acierta o si cae en celda ya disparada. */
  function runPcTurn() {
    if (phase !== GAME_PHASE.BATTLE) return;

    const row = Math.floor(Math.random() * BOARD_SIZE);
    const col = Math.floor(Math.random() * BOARD_SIZE);

    if (playerBoard[row][col] === CELL.SHIP) {
      notify("Ops! te han disparado");
      playerBoard[row][col] = CELL.HIT;
      addCellClass(OWNER.PLAYER, row, col, "hit");
      if (isFleetDestroyed(playerBoard)) {
        phase = GAME_PHASE.ENDED;
        notify("Ha ganado el PC");
        return;
      }
      runPcTurn();
      return;
    }

    if (playerBoard[row][col] === CELL.HIT || playerBoard[row][col] === CELL.MISS) {
      runPcTurn();
      return;
    }

    notify("El disparo del pc cayó al agua");
    playerBoard[row][col] = CELL.MISS;
    addCellClass(OWNER.PLAYER, row, col, "miss");
  }
}

init();
