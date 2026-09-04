import { state } from "../state/state.js";
import { getPublicStats } from "../services/storage.js";
import { requestQuote } from "../services/ai.js";
import { renderResult } from "./result.js";
import { goToStep, selectStyle } from "./steps.js";
import { resetImage } from "./image.js";
import { t } from "../i18n.js";

const loadingMsgs = [
  "evaluating",
  "reviewingDetails",
  "calculatingDifficulty",
  "checkingQueue"
];

export async function loadPublicBanner() {
  try {
    const { promedio, atendidos } = await getPublicStats();
    document.getElementById("publicBanner").innerHTML =
      (promedio ? `<span>⭐ <b>${promedio.toFixed(1)}</b>/5</span>` : "") +
      `<span><b>${atendidos}</b> ${t("completedOrders").toLowerCase()}</span>`;
  } catch {
    document.getElementById("publicBanner").innerHTML = "";
  }
}

export async function runQuote() {
  goToStep(3);
  document.getElementById("loadingBlock").style.display = "block";
  document.getElementById("resultBlock").style.display = "none";
  document.getElementById("errorBlock").style.display = "none";

  let msgIdx = 0;
  const timer = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMsgs.length;
    document.getElementById("loadingMsg").textContent = t(loadingMsgs[msgIdx]);
  }, 1600);

  try {
    const { analysis, quote, queueInfo, orderId } = await requestQuote(
      state.imageBase64,
      state.mediaType,
      state.style
    );
    state.currentOrderId = orderId;

    clearInterval(timer);
    renderResult(analysis, quote, queueInfo, state.style);
    loadPublicBanner();
  } catch (error) {
    clearInterval(timer);
    console.error(error);
    document.getElementById("loadingBlock").style.display = "none";
    document.getElementById("errorBlock").style.display = "block";
    document.getElementById("errorMsg").textContent =
      `${t("quoteError")} (${error.message || t("connectionError")}). ${t("tryAgain")}`;
  }
}

export function initClient() {
  window.loadPublicBanner = loadPublicBanner;
  window.runQuote = runQuote;
  window.selectStyle = selectStyle;
  window.goToStep = goToStep;
  window.resetImage = resetImage;
}
