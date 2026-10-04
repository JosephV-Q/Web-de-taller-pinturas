import { getMyOrders } from "../services/orders.js";
import { getLanguage, t } from "../i18n.js";
import { escapeHtml, capitalize } from "../utils/helpers.js";

function formatPrice(price) {
  return new Intl.NumberFormat(getLanguage() === "en" ? "en-US" : "es-CO", {
    style: "currency",
    currency: "USD"
  }).format(price);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(
    getLanguage() === "en" ? "en-US" : "es-CO",
    { year: "numeric", month: "short", day: "numeric" }
  );
}

export async function loadMyOrders() {
  const container = document.getElementById("clientOrdersList");
  if (!container) return;

  container.innerHTML = `<p class="empty-note">${t("evaluating")}</p>`;

  try {
    const orders = await getMyOrders();

    if (!orders || orders.length === 0) {
      container.innerHTML = `<p class="empty-note" data-i18n="noOrdersYet">${escapeHtml(t("noOrdersYet"))}</p>`;
      return;
    }

    container.innerHTML = "";

    orders.forEach(order => {
      const card = document.createElement("article");
      card.className = `order-history-card ${order.tipoPedido}`;

      const isPurchase = order.tipoPedido === "compra";
      const typeBadge = isPurchase
        ? `<span class="badge order-type-badge purchase">${t("purchaseType")}</span>`
        : `<span class="badge order-type-badge quote">${t("quoteType")}</span>`;

      const statusText = order.estado === "atendido" ? t("completedOrders") : t("pending");
      const statusClass = order.estado === "atendido" ? "atendido" : "pendiente";
      const statusBadge = `<span class="badge ${statusClass}">${statusText}</span>`;

      let contentHtml = "";

      if (isPurchase) {
        const itemsList = (order.detalle || []).map(d => `
          <div class="history-item-row">
            <span>${escapeHtml(d.productoNombre)} <strong>x${d.cantidad}</strong></span>
            <span class="history-item-price">${formatPrice(d.precioUnitario)}</span>
          </div>
        `).join("");

        contentHtml = `
          <div class="history-card-header">
            <div class="history-title-wrap">
              ${typeBadge}
              <span class="history-date">${formatDate(order.fechaCreacion)}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="history-details-box">
            <p class="history-details-label">${t("orderItems")}:</p>
            ${itemsList}
          </div>
          <div class="history-card-footer">
            <span>${t("total")}:</span>
            <strong class="history-total-price">${formatPrice(order.precio)}</strong>
          </div>
        `;
      } else {
        contentHtml = `
          <div class="history-card-header">
            <div class="history-title-wrap">
              ${typeBadge}
              <span class="history-date">${formatDate(order.fechaCreacion)}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="history-details-box">
            <p class="history-furniture-desc">
              <strong>${capitalize(order.mueble || "Mueble")}</strong> · ${order.estilo ? capitalize(order.estilo) : ""}
            </p>
            <p class="meta">
              ${order.horas ? `${order.horas} h · ` : ""}${t("deliveryDate")}: ${formatDate(order.fechaEntrega)}
            </p>
          </div>
          <div class="history-card-footer">
            <span>${t("estimatedPrice")}:</span>
            <strong class="history-total-price">${formatPrice(order.precio)}</strong>
          </div>
        `;
      }

      card.innerHTML = contentHtml;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = `<p class="error">${escapeHtml(error.message || t("tryAgain"))}</p>`;
  }
}

export function initHistory() {
  window.loadMyOrders = loadMyOrders;
}
