/**
 * Overlay modal de bienvenida con instrucciones del juego.
 *
 * SRP: solo se encarga del overlay inicial. La orquestación (cuándo cerrarlo,
 * qué fase entra después) la decide main.js a través del callback `onStart`.
 */

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
          Repite hasta colocar todos los barcos.
        </li>
        <li>
          Cuando estén todos colocados, pulsa <strong>"Empezar juego"</strong>.
        </li>
        <li>
          <strong>Dispara</strong> haciendo clic en el tablero enemigo (derecha).
          Si aciertas, vuelves a tirar; si fallas, le toca al PC.
        </li>
      </ol>
      <button type="button" class="welcome-button" id="welcomeStartBtn">
        Comenzar
      </button>
    </div>
  `;
  return overlay;
}

/**
 * Muestra el overlay de bienvenida. Si ya está montado en el HTML lo reutiliza.
 * @param {{ onStart?: () => void }} options
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
    hideWelcome();
    if (typeof onStart === "function") onStart();
  };
  startBtn.addEventListener("click", handler);
}

export function hideWelcome() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  overlay.classList.remove("is-visible");
  document.body.classList.remove("modal-open");
}
