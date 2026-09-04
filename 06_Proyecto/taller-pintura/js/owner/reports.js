import { generateImprovementReport } from "../services/ai.js";
import { escapeHtml } from "../utils/helpers.js";
import { t } from "../i18n.js";

export async function generateReport() {
  const box = document.getElementById("reportBox");
  box.innerHTML =
    `<div class="loading" style="padding:14px 0;"><div class="spinner" style="width:22px;height:22px;"></div><p>${t("analyzing")}</p></div>`;

  try {
    const texto = await generateImprovementReport();
    box.innerHTML =
      `<div class="report-box">${escapeHtml(texto)}</div>` +
      `<p style="margin-top:6px;color:var(--muted);font-size:11px;">${t("generatedNow")}</p>`;
  } catch (error) {
    box.innerHTML = `<div class="error">${escapeHtml(error.message || t("reportError"))}</div>`;
  }
}

export function initReports() {
  window.generateReport = generateReport;
}
