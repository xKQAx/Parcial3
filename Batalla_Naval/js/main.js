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
  getShipCells,
  placeFleetRandom,
  placeShip,
} from "./placement.js";
import { isAlreadyShot, isFleetDestroyed } from "./gameRules.js";
import {
  addCellClass,
  createBoardGrid,
  isCellShot,
  markShot,
  removeCellClasses,
} from "./ui/domBoard.js";
import { notify } from "./ui/notifications.js";
import { showWelcome } from "./ui/welcome.js";
import {
  hideTurnIndicator,
  mountTurnIndicator,
  setTurn,
} from "./ui/turnIndicator.js";
import {
  clearShipSelection,
  disableShipPanel,
  mountShipPanel,
  updateShipPanel,
} from "./ui/shipPanel.js";
import {
  attachPreview,
  clearPreview,
  detachPreview,
} from "./ui/placementPreview.js";

/** Pequeño retardo para que los disparos del PC no se sientan instantáneos. */
const PC_TURN_DELAY_MS = 600;

/** Estado del juego encapsulado en un objeto para facilitar el reinicio. */
function createInitialState() {
  return {
    playerBoard: createEmptyBoard(),
    pcBoard: null,
    remainingByType: FLEET_BY_TYPE.map((t) => t.count),
    phase: GAME_PHASE.PLACING,
    placementChoice: null,
    /** Barcos colocados por el jugador. Permite retirarlos por click. */
    placedShips: [],
  };
}

function init() {
  const boardEl = document.querySelector("#board");
  const boardAttackEl = document.querySelector("#boardAttack");
  const startBtn = document.querySelector("#button");
  const resetBtn = document.querySelector("#resetButton");
  const shipPanelEl = document.querySelector("#shipPanel");
  const turnIndicatorEl = document.querySelector("#turnIndicator");

  /** @type {ReturnType<typeof createInitialState>} */
  let state = createInitialState();
  state.phase = GAME_PHASE.WELCOME;

  mountTurnIndicator(turnIndicatorEl);
  renderPlacementUI();

  startBtn.addEventListener("click", onStartGame);
  resetBtn.addEventListener("click", () => resetGame({ showToast: true }));

  showWelcome({
    onStart: () => {
      state.phase = GAME_PHASE.PLACING;
      notify.info("Coloca todos tus barcos para comenzar.");
    },
  });

  // ----------------------- Render / Reset --------------------------------

  function renderPlacementUI() {
    createBoardGrid(boardEl, OWNER.PLAYER, onPlayerBoardClick);
    boardAttackEl.replaceChildren();
    mountShipPanel({
      container: shipPanelEl,
      fleet: FLEET_BY_TYPE,
      onSelect: onSelectShip,
    });
    startBtn.disabled = true;
    hideTurnIndicator();

    attachPreview({
      root: boardEl,
      getSelection: () =>
        state.phase === GAME_PHASE.PLACING && state.placementChoice
          ? {
              orientation: state.placementChoice.orientation,
              length: state.placementChoice.length,
            }
          : null,
      canPlace: (row, col, length, orientation) =>
        canPlaceShip(state.playerBoard, row, col, length, orientation),
    });
  }

  function resetGame({ showToast = false } = {}) {
    detachPreview();
    state = createInitialState();
    renderPlacementUI();
    if (showToast) notify.info("Juego reiniciado. Coloca tus barcos.");
  }

  // ----------------------- Selección de barco -----------------------------

  function onSelectShip({ orientation, typeIndex, length }) {
    if (state.phase !== GAME_PHASE.PLACING) return;
    if (
      orientation !== ORIENTATION.HORIZONTAL &&
      orientation !== ORIENTATION.VERTICAL
    ) {
      return;
    }
    if (state.remainingByType[typeIndex] <= 0) {
      notify.warn("No te quedan barcos de ese tipo.");
      return;
    }
    state.placementChoice = { orientation, typeIndex, length };
    clearPreview();
  }

  // ----------------------- Click sobre tablero del jugador ----------------

  function onPlayerBoardClick(event) {
    if (state.phase !== GAME_PHASE.PLACING) return;
    const cell = event.target.closest(".grid");
    if (!cell || cell.dataset.owner !== OWNER.PLAYER) return;

    const row = Number.parseInt(cell.dataset.row, 10);
    const col = Number.parseInt(cell.dataset.col, 10);

    // Click sobre celda con barco colocado: lo retira (permite corregir).
    if (state.playerBoard[row][col] === CELL.SHIP) {
      removePlacedShipAt(row, col);
      return;
    }

    if (!state.placementChoice) {
      notify.warn(
        "Selecciona orientación y tipo de barco antes de colocarlo."
      );
      return;
    }

    placePlayerShip(row, col);
  }

  function placePlayerShip(row, col) {
    const { orientation, typeIndex, length } = state.placementChoice;

    if (state.remainingByType[typeIndex] <= 0) {
      notify.warn("Debes seleccionar un barco disponible.");
      return;
    }

    if (!canPlaceShip(state.playerBoard, row, col, length, orientation)) {
      notify.error(
        "Posición inválida: fuera del tablero o se solapa con otro barco."
      );
      return;
    }

    placeShip(state.playerBoard, row, col, length, orientation);
    const cells = getShipCells(row, col, length, orientation);
    for (const [r, c] of cells) addCellClass(OWNER.PLAYER, r, c, "selected");

    state.placedShips.push({ typeIndex, length, orientation, cells });
    state.remainingByType[typeIndex] -= 1;
    state.placementChoice = null;
    clearShipSelection();
    clearPreview();
    updateShipPanel(state.remainingByType);

    const totalLeft = state.remainingByType.reduce((a, b) => a + b, 0);
    if (totalLeft === 0) {
      startBtn.disabled = false;
      notify.success(
        "¡Flota lista! Pulsa 'Empezar juego' para comenzar la batalla."
      );
    }
  }

  function removePlacedShipAt(row, col) {
    const idx = state.placedShips.findIndex((s) =>
      s.cells.some(([r, c]) => r === row && c === col)
    );
    if (idx === -1) return;
    const ship = state.placedShips[idx];

    for (const [r, c] of ship.cells) {
      state.playerBoard[r][c] = CELL.EMPTY;
      removeCellClasses(OWNER.PLAYER, r, c, "selected");
    }
    state.placedShips.splice(idx, 1);
    state.remainingByType[ship.typeIndex] += 1;
    updateShipPanel(state.remainingByType);
    startBtn.disabled = true;
    clearPreview();
    notify.info("Barco retirado. Puedes recolocarlo.");
  }

  // ----------------------- Inicio de batalla ------------------------------

  function onStartGame() {
    if (state.phase !== GAME_PHASE.PLACING) return;

    const totalLeft = state.remainingByType.reduce((a, b) => a + b, 0);
    if (totalLeft > 0) {
      notify.warn("Coloca todos tus barcos antes de empezar.");
      return;
    }

    state.pcBoard = createEmptyBoard();
    try {
      placeFleetRandom(
        state.pcBoard,
        FLEET_BY_TYPE.map((t) => ({ length: t.length, count: t.count }))
      );
    } catch (e) {
      notify.error(e.message || "Error al colocar la flota del PC.");
      state.pcBoard = null;
      return;
    }

    detachPreview();
    createBoardGrid(boardAttackEl, OWNER.PC, onPlayerShotClick);
    state.phase = GAME_PHASE.BATTLE;
    startBtn.disabled = true;
    disableShipPanel();
    setTurn(OWNER.PLAYER);
    notify.info("¡Comienza la batalla! Es tu turno.");
  }

  // ----------------------- Disparos ---------------------------------------

  function onPlayerShotClick(event) {
    if (state.phase !== GAME_PHASE.BATTLE || !state.pcBoard) return;
    const cell = event.target.closest(".grid");
    if (!cell || cell.dataset.owner !== OWNER.PC) return;

    const row = Number.parseInt(cell.dataset.row, 10);
    const col = Number.parseInt(cell.dataset.col, 10);

    if (
      isCellShot(OWNER.PC, row, col) ||
      isAlreadyShot(state.pcBoard, row, col)
    ) {
      notify.warn("Ya disparaste en esa casilla.");
      return;
    }

    if (state.pcBoard[row][col] === CELL.SHIP) {
      state.pcBoard[row][col] = CELL.HIT;
      addCellClass(OWNER.PC, row, col, "hit");
      markShot(OWNER.PC, row, col);
      notify.success("¡Tocado! Vuelve a disparar.");
      if (isFleetDestroyed(state.pcBoard)) {
        state.phase = GAME_PHASE.ENDED;
        hideTurnIndicator();
        notify.success("¡GANASTE! Hundiste toda la flota enemiga.", {
          duration: 5000,
        });
      }
      return;
    }

    state.pcBoard[row][col] = CELL.MISS;
    addCellClass(OWNER.PC, row, col, "miss");
    markShot(OWNER.PC, row, col);
    notify.info("Agua. Turno del PC.");
    setTurn(OWNER.PC);
    setTimeout(runPcTurn, PC_TURN_DELAY_MS);
  }

  /** Replica la lógica original: el PC repite disparo si acierta o si cae en celda ya disparada. */
  function runPcTurn() {
    if (state.phase !== GAME_PHASE.BATTLE) return;

    const row = Math.floor(Math.random() * BOARD_SIZE);
    const col = Math.floor(Math.random() * BOARD_SIZE);

    if (state.playerBoard[row][col] === CELL.SHIP) {
      state.playerBoard[row][col] = CELL.HIT;
      addCellClass(OWNER.PLAYER, row, col, "hit");
      markShot(OWNER.PLAYER, row, col);
      notify.error("¡Te han dado!");
      if (isFleetDestroyed(state.playerBoard)) {
        state.phase = GAME_PHASE.ENDED;
        hideTurnIndicator();
        notify.error("Ha ganado el PC. Tu flota ha sido hundida.", {
          duration: 5000,
        });
        return;
      }
      setTimeout(runPcTurn, PC_TURN_DELAY_MS);
      return;
    }

    if (
      state.playerBoard[row][col] === CELL.HIT ||
      state.playerBoard[row][col] === CELL.MISS
    ) {
      runPcTurn();
      return;
    }

    state.playerBoard[row][col] = CELL.MISS;
    addCellClass(OWNER.PLAYER, row, col, "miss");
    markShot(OWNER.PLAYER, row, col);
    notify.info("El disparo del PC cayó al agua. Tu turno.");
    setTurn(OWNER.PLAYER);
  }
}

init();
