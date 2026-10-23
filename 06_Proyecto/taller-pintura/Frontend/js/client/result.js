import { capitalize, escapeHtml } from "../utils/helpers.js";
import { t, getLanguage } from "../i18n.js";
import { state } from "../state/state.js";
import { resetQuote, goToMainPageAfterQuote } from "./client.js";

let lastResult;

export function renderResult(analysis, quote, queueInfo, style, orderId, color) {
  const currentOrderId = orderId || state.currentOrderId;
  const currentColor = color !== undefined ? color : state.color;

  lastResult = { analysis, quote, queueInfo, style, orderId: currentOrderId, color: currentColor };
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

  let estiloLabel = t("natural");
  if (style === "rallado") {
    estiloLabel = t("scratched") + (getLanguage() === "es" ? " (veta de madera)" : " (wood grain)");
  } else if (style === "solo_color") {
    estiloLabel = t("soloColor");
  }

  const colorRow = currentColor
    ? `<div class="ticket-row"><span class="k">${t("color")}</span><span class="v"><strong>${escapeHtml(currentColor)}</strong></span></div>`
    : "";

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
    ${colorRow}
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

    <div class="success" style="margin-top: 20px; text-align: left; display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px; line-height: 1;">✓</span>
      <div>
        <strong>${t("quoteSavedSuccess")}${currentOrderId ? ` (#${currentOrderId})` : ""}</strong>
        <div style="font-size: 12px; opacity: 0.85; margin-top: 2px;">${t("quoteSavedHint")}</div>
      </div>
    </div>

    <div class="row" style="margin-top: 22px; display: flex; gap: 10px; flex-wrap: wrap;">
      <button class="primary" id="btnGoToMain" onclick="window.goToMainPageAfterQuote()">${t("goToMainPage")}</button>
      <button class="ghost" id="btnAnotherFurniture" onclick="window.resetQuote()">${t("anotherFurniture")}</button>
    </div>
  `;
}

window.addEventListener("languagechange", () => {
  if (lastResult) {
    renderResult(
      lastResult.analysis,
      lastResult.quote,
      lastResult.queueInfo,
      lastResult.style,
      lastResult.orderId,
      lastResult.color
    );
  }
});
