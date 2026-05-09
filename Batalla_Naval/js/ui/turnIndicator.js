/**
 * Indicador visual de turno (Tú / PC).
 *
 * SRP: solo dibuja y actualiza dos chips. La decisión de qué turno mostrar
 * la toma main.js tras cada disparo.
 */

import { OWNER } from "../config.js";

let mounted = null;

/** Monta el indicador dentro del contenedor dado. Idempotente. */
export function mountTurnIndicator(container) {
  if (!container) return;
  container.replaceChildren();

  const wrap = document.createElement("div");
  wrap.className = "turn-indicator";
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");

  const label = document.createElement("span");
  label.className = "turn-indicator__label";
  label.textContent = "Turno:";

  const playerChip = document.createElement("span");
  playerChip.className = "turn-chip turn-chip--player";
  playerChip.dataset.owner = OWNER.PLAYER;
  playerChip.textContent = "Tú";

  const pcChip = document.createElement("span");
  pcChip.className = "turn-chip turn-chip--pc";
  pcChip.dataset.owner = OWNER.PC;
  pcChip.textContent = "PC";

  wrap.append(label, playerChip, pcChip);
  container.appendChild(wrap);

  mounted = { wrap, playerChip, pcChip };
  hideTurnIndicator();
}

/** Resalta el chip del owner activo. */
export function setTurn(owner) {
  if (!mounted) return;
  mounted.wrap.classList.add("is-visible");
  const isPlayer = owner === OWNER.PLAYER;
  mounted.playerChip.classList.toggle("is-active", isPlayer);
  mounted.pcChip.classList.toggle("is-active", !isPlayer);
}

export function hideTurnIndicator() {
  if (!mounted) return;
  mounted.wrap.classList.remove("is-visible");
  mounted.playerChip.classList.remove("is-active");
  mounted.pcChip.classList.remove("is-active");
}
