/**
 * IA del PC.
 *
 * Patrón: Strategy. Una interfaz común (`chooseShot`, `recordResult`)
 * y dos implementaciones intercambiables. main.js solo conoce la interfaz,
 * por lo que añadir nuevas dificultades en el futuro no requiere tocar la
 * lógica del juego.
 *
 * Convención de `result` para `recordResult(row, col, result)`:
 *  - "miss" : disparo fallido
 *  - "hit"  : tocó un barco pero no lo hundió
 *  - "sunk" : hundió el barco completo (HardAi reinicia su cacería)
 */

export const DIFFICULTY = Object.freeze({
  EASY: "easy",
  HARD: "hard",
});

const NEIGHBOR_DELTAS = Object.freeze([
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]);

function makeKey(row, col) {
  return `${row},${col}`;
}

/**
 * Modo fácil: aleatorio puro evitando celdas ya disparadas.
 */
function createEasyAi(boardSize) {
  const attempted = new Set();

  function chooseShot() {
    let row;
    let col;
    let key;
    let safety = boardSize * boardSize * 4;
    do {
      row = Math.floor(Math.random() * boardSize);
      col = Math.floor(Math.random() * boardSize);
      key = makeKey(row, col);
      if (--safety <= 0) break;
    } while (attempted.has(key));
    return [row, col];
  }

  function recordResult(row, col /*, result */) {
    attempted.add(makeKey(row, col));
  }

  return { chooseShot, recordResult };
}

/**
 * Modo difícil: estrategia "hunt & target".
 *  - Mientras no haya hits sin hundir: dispara aleatorio (hunt).
 *  - Tras un hit: encola las 4 celdas adyacentes (target).
 *  - Tras un segundo hit: deduce dirección y continúa esa línea.
 *  - Si la línea se agota o falla: prueba la dirección opuesta desde el primer hit.
 *  - Cuando hunde un barco: reinicia el estado de cacería.
 */
function createHardAi(boardSize) {
  const attempted = new Set();
  /** Cola de candidatos prioritarios [row, col]. */
  let huntQueue = [];
  /** Hits acumulados del barco actual. */
  let lineHits = [];
  /** Dirección [dr, dc] una vez confirmada. */
  let direction = null;
  /** True cuando ya se invirtió la dirección al menos una vez. */
  let reversed = false;

  function inBounds(r, c) {
    return r >= 0 && r < boardSize && c >= 0 && c < boardSize;
  }

  function enqueueIfValid(r, c) {
    if (!inBounds(r, c)) return;
    const key = makeKey(r, c);
    if (attempted.has(key)) return;
    if (huntQueue.some(([qr, qc]) => qr === r && qc === c)) return;
    huntQueue.push([r, c]);
  }

  function chooseShot() {
    while (huntQueue.length) {
      const [r, c] = huntQueue.shift();
      if (!attempted.has(makeKey(r, c)) && inBounds(r, c)) {
        return [r, c];
      }
    }
    let row;
    let col;
    let key;
    let safety = boardSize * boardSize * 4;
    do {
      row = Math.floor(Math.random() * boardSize);
      col = Math.floor(Math.random() * boardSize);
      key = makeKey(row, col);
      if (--safety <= 0) break;
    } while (attempted.has(key));
    return [row, col];
  }

  function resetHunt() {
    huntQueue = [];
    lineHits = [];
    direction = null;
    reversed = false;
  }

  function recordResult(row, col, result) {
    attempted.add(makeKey(row, col));

    if (result === "sunk") {
      resetHunt();
      return;
    }

    if (result === "hit") {
      lineHits.push([row, col]);

      if (lineHits.length === 1) {
        // Primer hit: encolar los 4 vecinos.
        for (const [dr, dc] of NEIGHBOR_DELTAS) {
          enqueueIfValid(row + dr, col + dc);
        }
        return;
      }

      // Segundo o posterior hit: fijar/confirmar dirección.
      if (!direction) {
        const [r0, c0] = lineHits[0];
        direction = [Math.sign(row - r0), Math.sign(col - c0)];
      }
      // Continuar la línea desde la última cell golpeada.
      huntQueue = [];
      enqueueIfValid(row + direction[0], col + direction[1]);
      return;
    }

    // result === "miss"
    if (direction && !reversed && lineHits.length >= 1) {
      // Probar la dirección opuesta desde el primer hit del barco actual.
      direction = [-direction[0], -direction[1]];
      reversed = true;
      huntQueue = [];
      const [r0, c0] = lineHits[0];
      enqueueIfValid(r0 + direction[0], c0 + direction[1]);
    }
  }

  return { chooseShot, recordResult };
}

/**
 * Factory de IA. Devuelve siempre una instancia con la misma interfaz.
 * @param {string} difficulty - DIFFICULTY.EASY | DIFFICULTY.HARD
 * @param {number} boardSize
 */
export function createAi(difficulty, boardSize) {
  if (difficulty === DIFFICULTY.HARD) return createHardAi(boardSize);
  return createEasyAi(boardSize);
}
