/**
 * Selector compacto de dificultad del PC siempre visible en pantalla
 * (complementa al selector del modal de bienvenida).
 *
 * SRP: solo gestiona el toggle visual. La política sobre cuándo se puede
 * cambiar (PLACING sí, BATTLE no) la decide main.js mediante setEnabled.
 */

import { DIFFICULTY } from "../ai.js";

const OPTIONS = Object.freeze([
  { value: DIFFICULTY.EASY, label: "Fácil" },
  { value: DIFFICULTY.HARD, label: "Difícil" },
]);

let mounted = null;

/**
 * Monta el toggle dentro del contenedor.
 * @param {{
 *   container: HTMLElement,
 *   initial?: string,
 *   onChange?: (difficulty: string) => void
 * }} options
 */
export function mountDifficultyToggle({ container, initial, onChange }) {
  if (!container) return;
  container.replaceChildren();
  container.classList.add("difficulty-toggle");

  const label = document.createElement("span");
  label.className = "difficulty-toggle__label";
  label.textContent = "Dificultad:";

  const group = document.createElement("div");
  group.className = "difficulty-toggle__group";
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", "Dificultad del PC");

  const buttons = OPTIONS.map((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "difficulty-toggle__btn";
    btn.dataset.value = opt.value;
    btn.textContent = opt.label;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      setValue(opt.value);
      if (typeof onChange === "function") onChange(opt.value);
    });
    group.appendChild(btn);
    return btn;
  });

  container.append(label, group);
  mounted = { container, buttons };

  setValue(initial || DIFFICULTY.EASY);
}

/** Marca visualmente la opción activa sin disparar onChange. */
export function setValue(difficulty) {
  if (!mounted) return;
  mounted.buttons.forEach((btn) => {
    const isActive = btn.dataset.value === difficulty;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-checked", String(isActive));
  });
}

/** Habilita/deshabilita el cambio (BATTLE/ENDED → false; PLACING → true). */
export function setEnabled(enabled) {
  if (!mounted) return;
  mounted.container.classList.toggle("is-disabled", !enabled);
  mounted.buttons.forEach((btn) => {
    btn.disabled = !enabled;
  });
}
