/**
 * Previsualización de colocación de barcos en el tablero del jugador.
 *
 * SRP: este módulo solo se encarga del feedback visual al pasar el mouse
 * (clases .preview-valid / .preview-invalid). No coloca el barco ni cambia
 * el estado del juego.
 *
 * Patrón: usa delegación de eventos en el contenedor del tablero
 * (mouseover/mouseout) y un proveedor de "selección actual" inyectado
 * desde main.js para mantener la lógica de placement allí.
 */

import { ORIENTATION } from "../config.js";

const PREVIEW_CLASSES = ["preview-valid", "preview-invalid"];

/** Estado interno (un solo tablero suele bastar; se asume player). */
let attachedRoot = null;
let getSelection = null;
let canPlace = null;

/**
 * @param {{
 *   root: HTMLElement,
 *   getSelection: () => ({ orientation: string, length: number } | null),
 *   canPlace: (row: number, col: number, length: number, orientation: string) => boolean
 * }} options
 */
export function attachPreview({ root, getSelection: gs, canPlace: cp }) {
  if (!root) return;
  detachPreview();
  attachedRoot = root;
  getSelection = gs;
  canPlace = cp;

  root.addEventListener("mouseover", onCellEnter);
  root.addEventListener("mouseout", onCellLeave);
}

export function detachPreview() {
  if (!attachedRoot) return;
  attachedRoot.removeEventListener("mouseover", onCellEnter);
  attachedRoot.removeEventListener("mouseout", onCellLeave);
  clearPreview();
  attachedRoot = null;
  getSelection = null;
  canPlace = null;
}

/** Quita cualquier preview activo (p.ej. al colocar, retirar o cambiar selección). */
export function clearPreview() {
  if (!attachedRoot) return;
  const cells = attachedRoot.querySelectorAll(
    ".grid.preview-valid, .grid.preview-invalid"
  );
  cells.forEach((c) => c.classList.remove(...PREVIEW_CLASSES));
}

function onCellEnter(event) {
  const cell = event.target.closest(".grid");
  if (!cell || !attachedRoot.contains(cell)) return;
  const selection = getSelection?.();
  if (!selection) return;

  const row = Number.parseInt(cell.dataset.row, 10);
  const col = Number.parseInt(cell.dataset.col, 10);
  const { orientation, length } = selection;

  clearPreview();

  const cells = computeCells(row, col, length, orientation);
  const valid = canPlace?.(row, col, length, orientation) === true;

  for (const [r, c] of cells) {
    const el = attachedRoot.querySelector(
      `.grid[data-row="${r}"][data-col="${c}"]`
    );
    if (el) el.classList.add(valid ? "preview-valid" : "preview-invalid");
  }
}

function onCellLeave(event) {
  // Solo limpiamos si el mouse sale realmente de una celda válida.
  const related = event.relatedTarget;
  if (related && attachedRoot && attachedRoot.contains(related)) {
    // movimiento entre celdas: el siguiente onCellEnter limpia y repinta.
    return;
  }
  clearPreview();
}

function computeCells(row, col, length, orientation) {
  const out = [];
  if (orientation === ORIENTATION.HORIZONTAL) {
    for (let c = col; c < col + length; c++) out.push([row, c]);
  } else {
    for (let r = row; r < row + length; r++) out.push([r, col]);
  }
  return out;
}
