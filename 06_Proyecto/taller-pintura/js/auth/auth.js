import { loginUser, registerUser } from "../services/authService.js";
import { clearSession } from "../config/api.js";
import { goHome, setActivePanel } from "../navigation/navigation.js";
import { t } from "../i18n.js";
import { clearCart } from "../cart/cart.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showMessage(id, message) {
  const box = document.getElementById(id);
  box.textContent = message;
  box.style.display = "block";
}

function hideMessage(id) {
  document.getElementById(id).style.display = "none";
}

function resetRegisterForm() {
  for (const id of ["regName", "regEmail", "regPassword", "regPassword2"]) {
    document.getElementById(id).value = "";
  }
  hideMessage("registerError");
  hideMessage("registerSuccess");
}

export async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("btnLogin");

  hideMessage("loginError");

  if (!EMAIL_RE.test(email)) {
    showMessage("loginError", t("validEmail"));
    return;
  }
  if (!password) {
    showMessage("loginError", t("enterPassword"));
    return;
  }

  btn.disabled = true;
  const result = await loginUser({ email, password });
  btn.disabled = false;

  if (!result.ok) {
    showMessage("loginError", result.message);
    return;
  }

  document.getElementById("roleGate").style.display = "none";

  if (result.rol === "dueno" || result.rol === "dueño") {
    document.getElementById("ownerApp").style.display = "block";
    document.getElementById("ownerDashboard").style.display = "block";
    window.loadOwnerDashboard?.();
    window.loadOwnerProducts?.();
    setActivePanel("owner-dashboard");
  } else {
    document.getElementById("clientApp").style.display = "block";
    document.getElementById("chatFab").style.display = "flex";
    window.loadPublicBanner?.();
    window.loadStore?.();
    window.loadMyOrders?.();
    setActivePanel("client-store");
  }
}

export function logout() {
  clearCart();
  clearSession();
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
  hideMessage("loginError");
  goHome();
}

export function showRegister() {
  document.getElementById("roleGate").style.display = "none";
  document.getElementById("registerView").style.display = "block";
}

export function cancelRegister() {
  document.getElementById("registerView").style.display = "none";
  document.getElementById("roleGate").style.display = "block";
  resetRegisterForm();
}

export async function handleRegister() {
  const nombre = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const password2 = document.getElementById("regPassword2").value;
  const btn = document.getElementById("btnRegister");

  hideMessage("registerError");
  hideMessage("registerSuccess");

  if (nombre.length < 3) {
    showMessage("registerError", t("fullNameError"));
    return;
  }
  if (!EMAIL_RE.test(email)) {
    showMessage("registerError", t("validEmail"));
    return;
  }
  if (password.length < 6) {
    showMessage("registerError", t("passwordLength"));
    return;
  }
  if (password !== password2) {
    showMessage("registerError", t("passwordMismatch"));
    return;
  }

  btn.disabled = true;
  const result = await registerUser({ nombre, email, password, rol: "cliente" });
  btn.disabled = false;

  if (!result.ok) {
    showMessage("registerError", result.message);
    return;
  }

  resetRegisterForm();
  showMessage("registerSuccess", t("accountCreated"));
  setTimeout(() => {
    hideMessage("registerSuccess");
    cancelRegister();
  }, 1500);
}
