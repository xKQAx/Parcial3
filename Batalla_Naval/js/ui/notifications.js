/**
 * Sistema de notificaciones (toasts) no modales.
 *
 * Patrón: Module pattern (estado encapsulado) + Strategy implícita por nivel
 * (info|success|warn|error) que solo cambia el estilo del toast.
 *
 * SRP: este módulo solo se encarga de mostrar/ocultar toasts. Reemplaza
 * por completo el uso de window.alert() en el juego.
 */

const DEFAULT_DURATION_MS = 2800;
const CONTAINER_ID = "toasts";

/** Niveles de toast soportados. Mantener sincronizado con CSS (.toast--<level>). */
const LEVELS = Object.freeze(["info", "success", "warn", "error"]);

function ensureContainer() {
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.className = "toasts";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  return container;
}

function show(level, message, opts = {}) {
  const safeLevel = LEVELS.includes(level) ? level : "info";
  const duration = Number.isFinite(opts.duration)
    ? Math.max(800, opts.duration)
    : DEFAULT_DURATION_MS;
  const container = ensureContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast--${safeLevel}`;
  toast.textContent = String(message);

  // Permitir cerrar manualmente con click (UX rápida durante partida).
  toast.addEventListener("click", () => dismiss(toast));
  container.appendChild(toast);

  // Forzar reflow para animar entrada con clase .is-visible.
  // eslint-disable-next-line no-unused-expressions
  toast.offsetWidth;
  toast.classList.add("is-visible");

  const timer = setTimeout(() => dismiss(toast), duration);
  toast.dataset.timer = String(timer);
  return toast;
}

function dismiss(toast) {
  if (!toast || !toast.isConnected) return;
  const timerId = Number(toast.dataset.timer);
  if (Number.isFinite(timerId)) clearTimeout(timerId);
  toast.classList.remove("is-visible");
  toast.classList.add("is-leaving");
  // Espera la animación de salida antes de remover.
  setTimeout(() => toast.remove(), 250);
}

export const notify = Object.freeze({
  info: (msg, opts) => show("info", msg, opts),
  success: (msg, opts) => show("success", msg, opts),
  warn: (msg, opts) => show("warn", msg, opts),
  error: (msg, opts) => show("error", msg, opts),
});
