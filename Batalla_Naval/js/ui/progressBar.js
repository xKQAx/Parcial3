/**
 * Barras de progreso de barcos hundidos por bando.
 *
 * SRP: solo dibuja y actualiza dos barras (Tu flota / Flota enemiga).
 * Quien decide cuándo subir el contador es main.js, tras detectar
 * que un barco entero fue hundido.
 */

import { OWNER } from "../config.js";

const bars = new Map(); // owner -> { fillEl, labelEl }

const TITLE_BY_OWNER = {
  [OWNER.PLAYER]: "Tu flota",
  [OWNER.PC]: "Flota enemiga",
};

/**
 * Monta las dos barras (PC primero) dentro del contenedor.
 * @param {{ container: HTMLElement, total: number }} options
 */
export function mountProgressBars({ container, total }) {
  if (!container) return;
  container.replaceChildren();
  container.classList.add("progress-bars");
  bars.clear();

  for (const owner of [OWNER.PC, OWNER.PLAYER]) {
    const wrap = buildBar(owner, total);
    container.appendChild(wrap.root);
    bars.set(owner, wrap);
  }
}

function buildBar(owner, total) {
  const root = document.createElement("div");
  root.className = `progress-bar progress-bar--${owner}`;

  const header = document.createElement("div");
  header.className = "progress-bar__header";

  const title = document.createElement("span");
  title.className = "progress-bar__title";
  title.textContent = TITLE_BY_OWNER[owner] || owner;

  const label = document.createElement("span");
  label.className = "progress-bar__label";
  label.textContent = `0 / ${total} hundidos`;

  header.append(title, label);

  const track = document.createElement("div");
  track.className = "progress-bar__track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(total));
  track.setAttribute("aria-valuenow", "0");

  const fill = document.createElement("div");
  fill.className = "progress-bar__fill";
  fill.style.width = "0%";
  track.appendChild(fill);

  root.append(header, track);
  return { root, fillEl: fill, labelEl: label, trackEl: track, total };
}

/**
 * Actualiza la barra del owner indicado.
 * @param {string} owner
 * @param {number} sunkCount
 */
export function updateProgress(owner, sunkCount) {
  const entry = bars.get(owner);
  if (!entry) return;
  const safeCount = Math.max(0, Math.min(entry.total, sunkCount));
  const pct = entry.total === 0 ? 0 : (safeCount / entry.total) * 100;
  entry.fillEl.style.width = `${pct}%`;
  entry.labelEl.textContent = `${safeCount} / ${entry.total} hundidos`;
  entry.trackEl.setAttribute("aria-valuenow", String(safeCount));
}

/** Resetea ambas barras a cero. */
export function resetProgressBars() {
  for (const owner of bars.keys()) updateProgress(owner, 0);
}
