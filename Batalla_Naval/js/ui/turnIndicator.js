/**
 * Indicador visual de turno (Tú / PC) y contador de disparos.
 *
 * SRP: solo dibuja y actualiza dos chips + contador. La decisión de qué
 * turno mostrar y cuántos disparos llevamos la toma main.js tras cada disparo.
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

  const counter = document.createElement("span");
  counter.className = "turn-indicator__counter";
  counter.textContent = "Disparos: 0";

  wrap.append(label, playerChip, pcChip, counter);
  container.appendChild(wrap);

  mounted = { wrap, playerChip, pcChip, counter };
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

/** Actualiza el contador de disparos visible junto a los chips. */
export function setShotCount(count) {
  if (!mounted) return;
  mounted.counter.textContent = `Disparos: ${count}`;
}

export function hideTurnIndicator() {
  if (!mounted) return;
  mounted.wrap.classList.remove("is-visible");
  mounted.playerChip.classList.remove("is-active");
  mounted.pcChip.classList.remove("is-active");
}
