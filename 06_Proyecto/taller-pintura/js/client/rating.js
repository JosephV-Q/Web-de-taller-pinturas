import { t } from "../i18n.js";

import { state, selectedStars, setSelectedStars } from "../state/state.js";
import { apiFetch } from "../config/api.js";

export function buildStarInput() {
  const el = document.getElementById("starsInput");
  el.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    star.onclick = () => {
      setSelectedStars(i);
      paintStars();
    };
    el.appendChild(star);
  }

  setSelectedStars(0);
  paintStars();
}

export function paintStars() {
  document.querySelectorAll("#starsInput span").forEach((star, index) => {
    star.classList.toggle("filled", index < selectedStars);
  });
}

export async function submitRating() {
  if (selectedStars === 0) {
    alert(t("selectStars"));
    return;
  }

  const comentario = document.getElementById("comentarioInput").value.trim();

  try {
    await apiFetch("/ratings", {
      method: "POST",
      body: { estrellas: selectedStars, comentario, pedidoId: state.currentOrderId || null },
      auth: true
    });

    document.getElementById("ratingBox").innerHTML =
      `<p class="thanks">${t("thanks")}</p>`;

    window.loadPublicBanner?.();
  } catch (error) {
    console.error(error);
    alert(t("ratingError"));
  }
}
