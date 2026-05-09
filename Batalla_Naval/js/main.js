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
  revealRemainingShips,
} from "./ui/domBoard.js";
import { notify } from "./ui/notifications.js";
import { showWelcome } from "./ui/welcome.js";
import {
  hideTurnIndicator,
  mountTurnIndicator,
  setShotCount,
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
import {
  addShotEntry,
  clearShotHistory,
  mountShotHistory,
} from "./ui/shotHistory.js";
import {
  mountProgressBars,
  resetProgressBars,
  updateProgress,
} from "./ui/progressBar.js";
import {
  mountDifficultyToggle,
  setEnabled as setDifficultyEnabled,
  setValue as setDifficultyValue,
} from "./ui/difficultyToggle.js";
import { createAi, DIFFICULTY } from "./ai.js";

/** Pequeño retardo para que los disparos del PC no se sientan instantáneos. */
const PC_TURN_DELAY_MS = 600;
/** Total de barcos por flota (suma de counts en FLEET_BY_TYPE). */
const TOTAL_SHIPS = FLEET_BY_TYPE.reduce((acc, t) => acc + t.count, 0);

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
    /** Barcos colocados por el PC (los rellena placeFleetRandom). */
    pcPlacedShips: [],
    /** Disparos totales (jugador + PC) para el contador de turnos. */
    shotsFired: 0,
    /** Hundidos por bando, indexado por owner. */
    sunkCounts: { [OWNER.PLAYER]: 0, [OWNER.PC]: 0 },
    /** Dificultad seleccionada en el modal de bienvenida. */
    difficulty: DIFFICULTY.EASY,
    /** Instancia de IA (Strategy). Se crea al iniciar la batalla. */
    ai: null,
  };
}

function init() {
  const boardEl = document.querySelector("#board");
  const boardAttackEl = document.querySelector("#boardAttack");
  const startBtn = document.querySelector("#button");
  const resetBtn = document.querySelector("#resetButton");
  const shipPanelEl = document.querySelector("#shipPanel");
  const turnIndicatorEl = document.querySelector("#turnIndicator");
  const shotHistoryEl = document.querySelector("#shotHistory");
  const progressBarsEl = document.querySelector("#progressBars");
  const difficultyToggleEl = document.querySelector("#difficultyToggle");

  /** @type {ReturnType<typeof createInitialState>} */
  let state = createInitialState();
  state.phase = GAME_PHASE.WELCOME;

  mountTurnIndicator(turnIndicatorEl);
  mountShotHistory(shotHistoryEl);
  mountProgressBars({ container: progressBarsEl, total: TOTAL_SHIPS });
  mountDifficultyToggle({
    container: difficultyToggleEl,
    initial: state.difficulty,
    onChange: (difficulty) => {
      // Solo se puede cambiar fuera de batalla (el toggle está deshabilitado
      // durante BATTLE/ENDED, esta guarda es defensa adicional).
      if (state.phase === GAME_PHASE.BATTLE) return;
      state.difficulty = difficulty;
    },
  });
  renderPlacementUI();

  startBtn.addEventListener("click", onStartGame);
  resetBtn.addEventListener("click", () => resetGame({ showToast: true }));

  showWelcome({
    onStart: ({ difficulty }) => {
      state.phase = GAME_PHASE.PLACING;
      state.difficulty = difficulty;
      setDifficultyValue(difficulty);
      notify.info(
        difficulty === DIFFICULTY.HARD
          ? "Modo Difícil. Coloca todos tus barcos para comenzar."
          : "Coloca todos tus barcos para comenzar."
      );
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
    setShotCount(0);
    clearShotHistory();
    resetProgressBars();
    setDifficultyValue(state.difficulty);
    setDifficultyEnabled(true);

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
    const previousDifficulty = state.difficulty;
    state = createInitialState();
    state.difficulty = previousDifficulty;
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
      state.pcPlacedShips = placeFleetRandom(
        state.pcBoard,
        FLEET_BY_TYPE.map((t) => ({ length: t.length, count: t.count }))
      );
    } catch (e) {
      notify.error(e.message || "Error al colocar la flota del PC.");
      state.pcBoard = null;
      return;
    }

    state.ai = createAi(state.difficulty, BOARD_SIZE);

    detachPreview();
    createBoardGrid(boardAttackEl, OWNER.PC, onPlayerShotClick);
    state.phase = GAME_PHASE.BATTLE;
    startBtn.disabled = true;
    disableShipPanel();
    setDifficultyEnabled(false);
    setTurn(OWNER.PLAYER);
    setShotCount(state.shotsFired);
    notify.info(
      state.difficulty === DIFFICULTY.HARD
        ? "¡Comienza la batalla! Modo Difícil. Es tu turno."
        : "¡Comienza la batalla! Es tu turno."
    );
  }

  // ----------------------- Disparos ---------------------------------------

  /**
   * Detecta si un barco de `ships` que contiene la cell (row,col) está hundido
   * (todas sus cells en CELL.HIT). Devuelve el barco hundido o null.
   */
  function findSunkShipAt(ships, board, row, col) {
    const ship = ships.find((s) =>
      s.cells.some(([r, c]) => r === row && c === col)
    );
    if (!ship) return null;
    const allHit = ship.cells.every(([r, c]) => board[r][c] === CELL.HIT);
    return allHit ? ship : null;
  }

  function shipNameOf(typeIndex) {
    return FLEET_BY_TYPE[typeIndex]?.name ?? "barco";
  }

  function incShots() {
    state.shotsFired += 1;
    setShotCount(state.shotsFired);
  }

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

    incShots();

    if (state.pcBoard[row][col] === CELL.SHIP) {
      state.pcBoard[row][col] = CELL.HIT;
      addCellClass(OWNER.PC, row, col, "hit");
      markShot(OWNER.PC, row, col);

      const sunkShip = findSunkShipAt(
        state.pcPlacedShips,
        state.pcBoard,
        row,
        col
      );
      if (sunkShip) {
        const name = shipNameOf(sunkShip.typeIndex);
        for (const [r, c] of sunkShip.cells) addCellClass(OWNER.PC, r, c, "sunk");
        state.sunkCounts[OWNER.PC] += 1;
        updateProgress(OWNER.PC, state.sunkCounts[OWNER.PC]);
        addShotEntry({
          owner: OWNER.PLAYER,
          row,
          col,
          result: "sunk",
          shipName: name,
        });
        notify.success(`¡Hundiste el ${name}!`, { duration: 3500 });
      } else {
        addShotEntry({ owner: OWNER.PLAYER, row, col, result: "hit" });
        notify.success("¡Tocado! Vuelve a disparar.");
      }

      if (isFleetDestroyed(state.pcBoard)) {
        endGame(OWNER.PLAYER);
      }
      return;
    }

    state.pcBoard[row][col] = CELL.MISS;
    addCellClass(OWNER.PC, row, col, "miss");
    markShot(OWNER.PC, row, col);
    addShotEntry({ owner: OWNER.PLAYER, row, col, result: "miss" });
    notify.info("Agua. Turno del PC.");
    setTurn(OWNER.PC);
    setTimeout(runPcTurn, PC_TURN_DELAY_MS);
  }

  /**
   * El PC dispara según la AI seleccionada (Strategy). Si acierta o cae en
   * celda ya disparada, vuelve a tirar (lógica original).
   */
  function runPcTurn() {
    if (state.phase !== GAME_PHASE.BATTLE) return;

    const [row, col] = state.ai.chooseShot();

    // Salvavidas defensivo: si la AI por error eligió una celda ya disparada.
    if (
      state.playerBoard[row][col] === CELL.HIT ||
      state.playerBoard[row][col] === CELL.MISS
    ) {
      runPcTurn();
      return;
    }

    incShots();

    if (state.playerBoard[row][col] === CELL.SHIP) {
      state.playerBoard[row][col] = CELL.HIT;
      addCellClass(OWNER.PLAYER, row, col, "hit");
      markShot(OWNER.PLAYER, row, col);

      const sunkShip = findSunkShipAt(
        state.placedShips,
        state.playerBoard,
        row,
        col
      );
      if (sunkShip) {
        const name = shipNameOf(sunkShip.typeIndex);
        for (const [r, c] of sunkShip.cells) {
          addCellClass(OWNER.PLAYER, r, c, "sunk");
        }
        state.sunkCounts[OWNER.PLAYER] += 1;
        updateProgress(OWNER.PLAYER, state.sunkCounts[OWNER.PLAYER]);
        addShotEntry({
          owner: OWNER.PC,
          row,
          col,
          result: "sunk",
          shipName: name,
        });
        notify.error(`El PC hundió tu ${name}.`, { duration: 3500 });
        state.ai.recordResult(row, col, "sunk");
      } else {
        addShotEntry({ owner: OWNER.PC, row, col, result: "hit" });
        notify.error("¡Te han dado!");
        state.ai.recordResult(row, col, "hit");
      }

      if (isFleetDestroyed(state.playerBoard)) {
        endGame(OWNER.PC);
        return;
      }
      setTimeout(runPcTurn, PC_TURN_DELAY_MS);
      return;
    }

    state.playerBoard[row][col] = CELL.MISS;
    addCellClass(OWNER.PLAYER, row, col, "miss");
    markShot(OWNER.PLAYER, row, col);
    addShotEntry({ owner: OWNER.PC, row, col, result: "miss" });
    notify.info("El disparo del PC cayó al agua. Tu turno.");
    state.ai.recordResult(row, col, "miss");
    setTurn(OWNER.PLAYER);
  }

  function endGame(winner) {
    state.phase = GAME_PHASE.ENDED;
    hideTurnIndicator();
    if (winner === OWNER.PLAYER) {
      // Revelar barcos enemigos no hundidos (los que tenían cells sin tocar).
      revealRemainingShips(OWNER.PC, state.pcPlacedShips);
      notify.success(
        `¡GANASTE en ${state.shotsFired} disparos! Hundiste toda la flota enemiga.`,
        { duration: 6000 }
      );
    } else {
      revealRemainingShips(OWNER.PC, state.pcPlacedShips);
      notify.error(
        `Ha ganado el PC en ${state.shotsFired} disparos. Tu flota ha sido hundida.`,
        { duration: 6000 }
      );
    }
  }
}

init();
