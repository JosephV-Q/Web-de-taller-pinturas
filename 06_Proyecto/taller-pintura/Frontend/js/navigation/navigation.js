import { logout } from "../auth/auth.js";

export function goHome() {
  document.getElementById("roleGate").style.display = "block";
  document.getElementById("registerView").style.display = "none";
  document.getElementById("clientApp").style.display = "none";
  document.getElementById("ownerApp").style.display = "none";
  document.getElementById("chatFab").style.display = "none";
  document.getElementById("chatPanel").classList.remove("open");
}

export function enterClient() {
  document.getElementById("roleGate").style.display = "none";
  document.getElementById("clientApp").style.display = "block";
  document.getElementById("chatFab").style.display = "flex";
  window.loadPublicBanner?.();
  window.loadStore?.();
  window.loadMyOrders?.();
  setActivePanel("client-store");
}

export function setActivePanel(panelId) {
  const app = document.getElementById(panelId.startsWith("owner-") ? "ownerApp" : "clientApp");
  if (!app) return;
  app.querySelectorAll(".app-panel").forEach(panel => {
    const isSelected = panel.dataset.panel === panelId;
    panel.style.display = isSelected ? "block" : "none";
    panel.hidden = !isSelected;
    panel.classList.toggle("is-visible", isSelected);
  });
  app.querySelectorAll(".sidebar-link").forEach(link => {
    link.classList.toggle("active", link.dataset.nav === panelId);
  });
}

export function initNavigation() {
  window.goHome = goHome;
  window.enterClient = enterClient;
  window.logout = logout;
  document.addEventListener("click", event => {
    const link = event.target.closest("[data-nav]");
    if (link) setActivePanel(link.dataset.nav);
  });
}
