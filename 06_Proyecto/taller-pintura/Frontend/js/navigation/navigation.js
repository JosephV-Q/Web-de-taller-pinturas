import { logout } from "../auth/auth.js";

export function goHome() {
  document.documentElement.classList.remove("has-session");
  const roleGate = document.getElementById("roleGate");
  const registerView = document.getElementById("registerView");
  const clientApp = document.getElementById("clientApp");
  const ownerApp = document.getElementById("ownerApp");
  const chatFab = document.getElementById("chatFab");
  const chatPanel = document.getElementById("chatPanel");

  if (roleGate) roleGate.style.display = "block";
  if (registerView) registerView.style.display = "none";
  if (clientApp) clientApp.style.display = "none";
  if (ownerApp) ownerApp.style.display = "none";
  if (chatFab) chatFab.style.display = "none";
  if (chatPanel) chatPanel.classList.remove("open");
}

export function enterClient(panelId = "client-store") {
  document.documentElement.classList.add("has-session");
  const roleGate = document.getElementById("roleGate");
  const registerView = document.getElementById("registerView");
  const ownerApp = document.getElementById("ownerApp");
  const clientApp = document.getElementById("clientApp");
  const chatFab = document.getElementById("chatFab");

  if (roleGate) roleGate.style.display = "none";
  if (registerView) registerView.style.display = "none";
  if (ownerApp) ownerApp.style.display = "none";
  if (clientApp) clientApp.style.display = "block";
  if (chatFab) chatFab.style.display = "flex";

  window.loadPublicBanner?.();
  window.loadStore?.();
  window.loadMyOrders?.();
  setActivePanel(panelId || "client-store");
}

export function enterOwner(panelId = "owner-dashboard") {
  document.documentElement.classList.add("has-session");
  const roleGate = document.getElementById("roleGate");
  const registerView = document.getElementById("registerView");
  const clientApp = document.getElementById("clientApp");
  const ownerApp = document.getElementById("ownerApp");
  const chatFab = document.getElementById("chatFab");
  const chatPanel = document.getElementById("chatPanel");

  if (roleGate) roleGate.style.display = "none";
  if (registerView) registerView.style.display = "none";
  if (clientApp) clientApp.style.display = "none";
  if (chatFab) chatFab.style.display = "none";
  if (chatPanel) chatPanel.classList.remove("open");
  if (ownerApp) ownerApp.style.display = "block";

  const ownerDashboard = document.getElementById("ownerDashboard");
  if (ownerDashboard) ownerDashboard.style.display = "block";

  window.loadOwnerDashboard?.();
  window.loadOwnerProducts?.();
  setActivePanel(panelId || "owner-dashboard");
}

export function setActivePanel(panelId) {
  if (!panelId) return;
  const isOwner = panelId.startsWith("owner-");
  const app = document.getElementById(isOwner ? "ownerApp" : "clientApp");
  if (!app) return;

  sessionStorage.setItem("active_panel", panelId);

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
  window.enterOwner = enterOwner;
  window.setActivePanel = setActivePanel;
  window.logout = logout;
  document.addEventListener("click", event => {
    const link = event.target.closest("[data-nav]");
    if (link) setActivePanel(link.dataset.nav);
  });
}
