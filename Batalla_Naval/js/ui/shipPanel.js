/**
 * Panel de selección de naves: nombre, tamaño visual, conteo restante
 * y botones de orientación (horizontal/vertical) por tipo de barco.
 *
 * SRP: este módulo solo construye y mantiene el panel; no toca el tablero
 * ni la lógica de colocación. Notifica selecciones vía callback `onSelect`.
 *
 * DRY: el contador "restantes" se actualiza desde main.js con un solo
 * método (`updateShipPanel`) usando el mismo arreglo `remainingByType`.
 */

import { ORIENTATION } from "../config.js";

/** Estado interno del panel. */
let state = null;

/**
 * Monta el panel dentro del contenedor.
 * @param {{
 *   container: HTMLElement,
 *   fleet: ReadonlyArray<{ id:number, name:string, length:number, count:number }>,
 *   onSelect: (selection: { orientation: string, typeIndex: number, length: number }) => void
 * }} options
 */
export function mountShipPanel({ container, fleet, onSelect }) {
  if (!container || !Array.isArray(fleet)) return;
  container.replaceChildren();
  container.classList.add("ship-panel");

  const cards = fleet.map((shipType, typeIndex) =>
    buildShipCard(shipType, typeIndex, onSelect)
  );
  cards.forEach((card) => container.appendChild(card.root));

  state = { cards, fleet };
  updateShipPanel(fleet.map((s) => s.count));
}

function buildShipCard(shipType, typeIndex, onSelect) {
  const root = document.createElement("article");
  root.className = "ship-card";
  root.dataset.typeIndex = String(typeIndex);

  const header = document.createElement("header");
  header.className = "ship-card__header";

  const title = document.createElement("h4");
  title.className = "ship-card__title";
  title.textContent = shipType.name;

  const meta = document.createElement("span");
  meta.className = "ship-card__meta";
  meta.textContent = `${shipType.length} celdas`;

  header.append(title, meta);

  const preview = document.createElement("div");
  preview.className = "ship-card__preview";
  for (let i = 0; i < shipType.length; i++) {
    const cell = document.createElement("span");
    cell.className = "ship-mini";
    preview.appendChild(cell);
  }

  const badge = document.createElement("div");
  badge.className = "ship-card__badge";
  badge.textContent = `Restantes: ${shipType.count}/${shipType.count}`;

  const actions = document.createElement("div");
  actions.className = "ship-card__actions";

  const horizontalBtn = createOrientationButton(
    ORIENTATION.HORIZONTAL,
    typeIndex,
    shipType.length,
    onSelect
  );
  const verticalBtn = createOrientationButton(
    ORIENTATION.VERTICAL,
    typeIndex,
    shipType.length,
    onSelect
  );
  actions.append(horizontalBtn, verticalBtn);

  root.append(header, preview, badge, actions);
  return { root, badge, horizontalBtn, verticalBtn };
}

function createOrientationButton(orientation, typeIndex, length, onSelect) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `orientation-btn orientation-btn--${orientation}`;
  btn.dataset.orientation = orientation;
  btn.dataset.typeIndex = String(typeIndex);
  btn.setAttribute(
    "aria-label",
    orientation === ORIENTATION.HORIZONTAL
      ? "Colocar horizontal"
      : "Colocar vertical"
  );
  btn.textContent =
    orientation === ORIENTATION.HORIZONTAL ? "Horizontal" : "Vertical";

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    if (typeof onSelect === "function") {
      onSelect({ orientation, typeIndex, length });
    }
    highlightSelected(typeIndex, orientation);
  });
  return btn;
}

function highlightSelected(typeIndex, orientation) {
  if (!state) return;
  state.cards.forEach((card, idx) => {
    const isSelected = idx === typeIndex;
    card.root.classList.toggle("is-selected", isSelected);
    card.horizontalBtn.classList.toggle(
      "is-active",
      isSelected && orientation === ORIENTATION.HORIZONTAL
    );
    card.verticalBtn.classList.toggle(
      "is-active",
      isSelected && orientation === ORIENTATION.VERTICAL
    );
  });
}

/** Limpia el resaltado tras colocar un barco (no hay selección activa). */
export function clearShipSelection() {
  if (!state) return;
  state.cards.forEach((card) => {
    card.root.classList.remove("is-selected");
    card.horizontalBtn.classList.remove("is-active");
    card.verticalBtn.classList.remove("is-active");
  });
}

/**
 * Actualiza badges de "Restantes" y deshabilita botones cuando un tipo se agota.
 * @param {number[]} remainingByType
 */
export function updateShipPanel(remainingByType) {
  if (!state) return;
  state.cards.forEach((card, idx) => {
    const total = state.fleet[idx].count;
    const left = remainingByType[idx] ?? 0;
    card.badge.textContent = `Restantes: ${left}/${total}`;
    const isExhausted = left <= 0;
    card.root.classList.toggle("is-exhausted", isExhausted);
    card.horizontalBtn.disabled = isExhausted;
    card.verticalBtn.disabled = isExhausted;
  });
}

/** Deshabilita totalmente el panel (al pasar a fase de batalla). */
export function disableShipPanel() {
  if (!state) return;
  state.cards.forEach((card) => {
    card.horizontalBtn.disabled = true;
    card.verticalBtn.disabled = true;
    card.root.classList.add("is-disabled");
    card.root.classList.remove("is-selected");
    card.horizontalBtn.classList.remove("is-active");
    card.verticalBtn.classList.remove("is-active");
  });
}
