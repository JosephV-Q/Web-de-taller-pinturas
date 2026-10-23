// Sistema de notificaciones flotantes (Toasts)
// Accesible, responsivo, no intrusivo y con prevención de duplicados

let toastContainer = null;
const activeToasts = new Map();

function ensureContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.className = "toast-container";
      toastContainer.setAttribute("aria-live", "polite");
      toastContainer.setAttribute("aria-atomic", "false");
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function showToast(message, type = "info", duration = 4000) {
  if (!message || typeof message !== "string") return;

  const container = ensureContainer();
  const dedupKey = `${type}:::${message.trim()}`;

  // Prevención de duplicados: si ya existe una notificación idéntica activa,
  // renovamos su temporizador y la resaltamos sin duplicar el elemento.
  if (activeToasts.has(dedupKey)) {
    const existing = activeToasts.get(dedupKey);
    clearTimeout(existing.timer);
    existing.element.classList.remove("toast-highlight");
    // Trigger reflow to restart animation
    void existing.element.offsetWidth;
    existing.element.classList.add("toast-highlight");
    existing.timer = setTimeout(() => dismissToast(existing.element, dedupKey), duration);
    return existing.element;
  }

  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  let icon = "ℹ";
  if (type === "success") icon = "✓";
  else if (type === "error") icon = "✕";
  else if (type === "warning") icon = "⚠";

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <div class="toast-content">${escapeHtml(message)}</div>
    <button type="button" class="toast-close" aria-label="Cerrar notificación">×</button>
  `;

  const timer = setTimeout(() => {
    dismissToast(toast, dedupKey);
  }, duration);

  const toastEntry = { element: toast, timer };
  activeToasts.set(dedupKey, toastEntry);

  toast.querySelector(".toast-close").addEventListener("click", () => {
    clearTimeout(toastEntry.timer);
    dismissToast(toast, dedupKey);
  });

  container.appendChild(toast);

  // Animación de entrada
  requestAnimationFrame(() => {
    toast.classList.add("toast-visible");
  });

  return toast;
}

function dismissToast(toastElement, dedupKey) {
  if (!toastElement) return;
  activeToasts.delete(dedupKey);
  toastElement.classList.remove("toast-visible");
  toastElement.classList.add("toast-hiding");
  setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.parentNode.removeChild(toastElement);
    }
  }, 250);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function initToast() {
  ensureContainer();
  window.showToast = showToast;
}
