/**
 * Overlay modal de bienvenida con instrucciones del juego y selector de dificultad.
 *
 * SRP: solo se encarga del overlay inicial. La orquestación (cuándo cerrarlo,
 * qué fase entra después, qué dificultad usar) la decide main.js a través
 * del callback `onStart({ difficulty })`.
 */

import { DIFFICULTY } from "../ai.js";

const OVERLAY_ID = "welcomeOverlay";

function buildOverlay() {
  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "welcome-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "welcomeTitle");

  overlay.innerHTML = `
    <div class="welcome-card">
      <h2 id="welcomeTitle" class="welcome-title">Bienvenido a Batalla Naval</h2>
      <p class="welcome-subtitle">
        Hunde la flota enemiga antes que el PC hunda la tuya.
      </p>
      <ol class="welcome-steps">
        <li>
          <strong>Elige un barco</strong> y su orientación (horizontal o vertical)
          en el panel inferior.
        </li>
        <li>
          <strong>Haz clic en tu tablero</strong> (el de la izquierda) para colocarlo.
          Repite hasta colocar todos los barcos. Si te equivocas, haz clic de nuevo
          sobre un barco colocado para retirarlo.
        </li>
        <li>
          Cuando estén todos colocados, pulsa <strong>"Empezar juego"</strong>.
        </li>
        <li>
          <strong>Dispara</strong> haciendo clic en el tablero enemigo (derecha).
          Si aciertas, vuelves a tirar; si fallas, le toca al PC.
        </li>
      </ol>
      <fieldset class="difficulty-selector">
        <legend class="difficulty-selector__legend">Dificultad del PC</legend>
        <label class="difficulty-option">
          <input type="radio" name="difficulty" value="${DIFFICULTY.EASY}" checked />
          <span class="difficulty-option__label">
            <strong>Fácil</strong>
            <small>El PC dispara al azar.</small>
          </span>
        </label>
        <label class="difficulty-option">
          <input type="radio" name="difficulty" value="${DIFFICULTY.HARD}" />
          <span class="difficulty-option__label">
            <strong>Difícil</strong>
            <small>Tras un impacto, el PC caza el resto del barco.</small>
          </span>
        </label>
      </fieldset>
      <button type="button" class="welcome-button" id="welcomeStartBtn">
        Comenzar
      </button>
    </div>
  `;
  return overlay;
}

/**
 * Muestra el overlay de bienvenida. Si ya está montado en el HTML lo reutiliza.
 * @param {{ onStart?: (options: { difficulty: string }) => void }} options
 */
export function showWelcome({ onStart } = {}) {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = buildOverlay();
    document.body.appendChild(overlay);
  }
  overlay.classList.add("is-visible");
  document.body.classList.add("modal-open");

  const startBtn = overlay.querySelector("#welcomeStartBtn");
  const handler = () => {
    startBtn.removeEventListener("click", handler);
    const selected = overlay.querySelector(
      'input[name="difficulty"]:checked'
    );
    const difficulty = selected ? selected.value : DIFFICULTY.EASY;
    hideWelcome();
    if (typeof onStart === "function") onStart({ difficulty });
  };
  startBtn.addEventListener("click", handler);
}

export function hideWelcome() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  overlay.classList.remove("is-visible");
  document.body.classList.remove("modal-open");
}
