import { capitalize } from "../utils/helpers.js";
import { buildStarInput } from "./rating.js";
import { t, getLanguage } from "../i18n.js";

let lastResult;

export function renderResult(analysis, quote, queueInfo, style) {
  lastResult = { analysis, quote, queueInfo, style };
  document.getElementById("loadingBlock").style.display = "none";
  const block = document.getElementById("resultBlock");
  block.style.display = "block";

  const locale = getLanguage() === "en" ? "en-US" : "es-CO";
  const precioFmt = quote.precio.toLocaleString(locale, {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });

  const fechaFmt = queueInfo.deliveryDate.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const estiloLabel = style === "natural"
    ? t("natural")
    : t("scratched") + (getLanguage() === "es" ? " (veta de madera)" : " (wood grain)");

  block.innerHTML = `
    <div class="ticket-head">
      <div class="eyebrow">${t("quoteOrder")}</div>
      <h2>${capitalize(analysis.tipo_mueble)}</h2>
    </div>
    <div class="price-block">
      <div class="k">${t("estimatedPrice")}</div>
      <div class="v">${precioFmt}</div>
    </div>
    <hr class="divider">
    <div class="ticket-row"><span class="k">${t("style")}</span><span class="v">${estiloLabel}</span></div>
    <div class="ticket-row"><span class="k">${t("size")}</span><span class="v">${capitalize(analysis.tamano)}</span></div>
    <div class="ticket-row"><span class="k">${t("difficulty")}</span><span class="v">${analysis.dificultad} / 5</span></div>
    <div class="justif">${analysis.justificacion || ""}</div>
    <hr class="divider">
    <div class="ticket-row"><span class="k">${t("paintingTime")}</span><span class="v">${quote.horas} h</span></div>
    <div class="ticket-row"><span class="k">${t("deliveryDate")}</span><span class="v">${fechaFmt}</span></div>
    <div class="queue-note">
      <span>${t("queueBefore")}</span>
      <b>${queueInfo.pendingHoursBefore.toFixed(1)} ${t("queueHours")}</b>
    </div>
    <div class="row"><button class="ghost" onclick="location.reload()">${t("anotherFurniture")}</button></div>
  `;
}

window.addEventListener("languagechange", () => {
  if (lastResult) renderResult(lastResult.analysis, lastResult.quote, lastResult.queueInfo, lastResult.style);
});
