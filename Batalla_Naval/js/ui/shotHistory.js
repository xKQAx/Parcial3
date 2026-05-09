/**
 * Historial de disparos de la partida.
 *
 * SRP: solo renderiza una lista cronológica de disparos.
 * Quien decide cuándo añadir o limpiar entradas es main.js.
 */

import { OWNER } from "../config.js";

const COL_LETTERS = "ABCDEFGHIJ";
const RESULT_LABEL = Object.freeze({
  hit: "Impacto",
  miss: "Agua",
  sunk: "Hundido",
});

let listEl = null;
let emptyEl = null;

/**
 * Monta el panel de historial dentro del contenedor.
 */
export function mountShotHistory(container) {
  if (!container) return;
  container.replaceChildren();
  container.classList.add("shot-history");

  const header = document.createElement("header");
  header.className = "shot-history__header";
  const title = document.createElement("h3");
  title.className = "shot-history__title";
  title.textContent = "Historial de disparos";
  header.appendChild(title);

  const list = document.createElement("ul");
  list.className = "shot-history__list";
  list.setAttribute("role", "log");
  list.setAttribute("aria-live", "polite");

  const empty = document.createElement("p");
  empty.className = "shot-history__empty";
  empty.textContent = "Aún no se han realizado disparos.";

  container.append(header, empty, list);
  listEl = list;
  emptyEl = empty;
}

/**
 * Añade una entrada al historial.
 * @param {{ owner: string, row: number, col: number, result: "hit"|"miss"|"sunk", shipName?: string }} entry
 */
export function addShotEntry({ owner, row, col, result, shipName }) {
  if (!listEl) return;
  emptyEl.style.display = "none";

  const li = document.createElement("li");
  li.className = `shot-entry shot-entry--${owner}`;

  const ownerEl = document.createElement("span");
  ownerEl.className = "shot-entry__owner";
  ownerEl.textContent = owner === OWNER.PLAYER ? "Tú" : "PC";

  const coordEl = document.createElement("span");
  coordEl.className = "shot-entry__coord";
  coordEl.textContent = `${COL_LETTERS[col] ?? col}${row + 1}`;

  const resultEl = document.createElement("span");
  resultEl.className = `shot-entry__result shot-entry__result--${result}`;
  resultEl.textContent =
    result === "sunk" && shipName
      ? `Hundido · ${shipName}`
      : RESULT_LABEL[result] || result;

  li.append(ownerEl, coordEl, resultEl);
  // Insertar al inicio para que lo más reciente quede visible primero.
  listEl.prepend(li);
}

export function clearShotHistory() {
  if (!listEl) return;
  listEl.replaceChildren();
  if (emptyEl) emptyEl.style.display = "";
}
