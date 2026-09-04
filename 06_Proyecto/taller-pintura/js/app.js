import { initNavigation } from "./navigation/navigation.js";
import { initImageUpload } from "./client/image.js";
import { initClient } from "./client/client.js";
import { submitRating } from "./client/rating.js";
import { initOwnerDashboard } from "./owner/dashboard.js";
import { initReports } from "./owner/reports.js";
import { initChat } from "./client/chat.js";
import { initStore } from "./client/store.js";
import { initOwnerProducts } from "./owner/products.js";
import { handleLogin, handleRegister, showRegister, cancelRegister, logout } from "./auth/auth.js";
import { initI18n } from "./i18n.js";
import { initCart } from "./cart/cart.js";
import { initHistory } from "./client/history.js";

document.addEventListener("DOMContentLoaded", () => {
  initI18n();
  initNavigation();
  initClient();
  initStore();
  initCart();
  initHistory();
  initImageUpload();
  initOwnerDashboard();
  initOwnerProducts();
  initReports();
  initChat();

  window.addEventListener("languagechange", () => {
    if (document.getElementById("clientApp").style.display !== "none") {
      window.loadPublicBanner?.();
      window.loadStore?.();
      window.loadMyOrders?.();
      window.cartModule?.renderCart?.();
    }
    if (document.getElementById("ownerApp").style.display !== "none") {
      window.loadOwnerDashboard?.();
      window.loadOwnerProducts?.();
    }
  });

  window.submitRating = submitRating;
  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;
  window.showRegister = showRegister;
  window.cancelRegister = cancelRegister;
  window.logout = logout;
});
