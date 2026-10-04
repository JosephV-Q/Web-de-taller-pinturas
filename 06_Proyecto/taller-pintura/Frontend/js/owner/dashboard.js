import { getOrders, getRatings, getReport, getAdminStats } from "../services/storage.js";
import { getLowStockProducts } from "../services/products.js";
import { capitalize, escapeHtml } from "../utils/helpers.js";
import { markAtendido } from "../services/orders.js";
import { t, getLanguage } from "../i18n.js";

function formatPrice(price) {
  return new Intl.NumberFormat(getLanguage() === "en" ? "en-US" : "es-CO", {
    style: "currency",
    currency: "USD"
  }).format(price);
}

function renderSalesHistory(orders) {
  const history = document.getElementById("salesHistoryList");
  if (!history) return;
  history.innerHTML = orders.length ? "" : `<p class="empty-note">${t("noSales")}</p>`;

  orders.forEach(order => {
    const row = document.createElement("div");
    const isPurchase = order.tipoPedido === "compra";
    const date = order.fechaCreacion
      ? new Date(order.fechaCreacion).toLocaleDateString(getLanguage() === "en" ? "en-US" : "es-CO")
      : "—";
    const description = isPurchase
      ? (order.detalle || []).map(item => `${escapeHtml(item.productoNombre)} x${item.cantidad}`).join(", ") || t("orderItems")
      : `${capitalize(order.mueble || "Mueble")} · ${order.estilo ? capitalize(order.estilo) : ""}`;
    const buyer = order.nombreComprador ? `<div class="meta">${t("buyer")}: ${escapeHtml(order.nombreComprador)}</div>` : "";
    row.className = "sales-history-row";
    row.innerHTML = `
      <div><strong>${isPurchase ? t("purchaseType") : t("quoteType")}</strong>${buyer}<div class="meta">${description}</div></div>
      <div class="sales-history-data"><span class="meta">${date}</span><strong>${formatPrice(order.precio)}</strong><span class="badge ${order.estado === "atendido" ? "atendido" : "pendiente"}">${t(order.estado === "atendido" ? "completed" : "pending")}</span></div>`;
    history.appendChild(row);
  });
}

export async function loadOwnerDashboard() {
  const results = await Promise.allSettled([
    getOrders(),
    getRatings(),
    getReport(),
    getLowStockProducts(),
    getAdminStats()
  ]);

  const pedidos       = results[0].status === "fulfilled" ? results[0].value : [];
  const ratings       = results[1].status === "fulfilled" ? results[1].value : [];
  const report        = results[2].status === "fulfilled" ? results[2].value : null;
  const lowStockProds = results[3].status === "fulfilled" ? results[3].value : [];
  const adminStats    = results[4].status === "fulfilled" ? results[4].value : null;

  const pendientes = pedidos.filter(p => p.estado === "pendiente");
  const atendidos = pedidos.filter(p => p.estado === "atendido");
  renderSalesHistory(pedidos);

  const statUsuarios = document.getElementById("statUsuarios");
  if (statUsuarios) statUsuarios.textContent = adminStats?.totalUsuarios ?? "–";

  const statProductos = document.getElementById("statProductos");
  if (statProductos) statProductos.textContent = adminStats?.totalProductos ?? "–";

  const statPedidosTotal = document.getElementById("statPedidosTotal");
  if (statPedidosTotal) statPedidosTotal.textContent = adminStats?.totalPedidos ?? pedidos.length;

  const statPend = document.getElementById("statPendientes");
  if (statPend) statPend.textContent = pendientes.length;

  const statAtend = document.getElementById("statAtendidos");
  if (statAtend) statAtend.textContent = atendidos.length;

  const prom = ratings.length
    ? ratings.reduce((sum, r) => sum + r.estrellas, 0) / ratings.length
    : null;

  const statCal = document.getElementById("statCalif");
  if (statCal) statCal.textContent = prom ? prom.toFixed(1) + " ★" : "—";

  const statNumCal = document.getElementById("statNumCalif");
  if (statNumCal) statNumCal.textContent = ratings.length;

  const statLowStock = document.getElementById("statLowStock");
  if (statLowStock) statLowStock.textContent = adminStats?.stockBajo ?? lowStockProds.length;

  const list = document.getElementById("listaPendientes");
  if (list) {
    list.innerHTML = pendientes.length
      ? ""
      : `<p class="empty-note">${t("noPending")}</p>`;

    pendientes.forEach(order => {
      const div = document.createElement("div");
      div.className = "order-row";

      const isPurchase = order.tipoPedido === "compra";
      let detailsText = "";

      if (isPurchase) {
        const itemsSummary = (order.detalle || []).map(d =>
          `${escapeHtml(d.productoNombre)} x${d.cantidad}`
        ).join(", ");
        detailsText = `
          <div>
            <strong style="color:var(--sage);">${t("purchaseType")}:</strong> ${itemsSummary || t("orderItems")}
          </div>
          <div class="meta">${t("buyer")}: ${escapeHtml(order.nombreComprador || "—")}</div>
          <div class="meta">${t("total")}: ${formatPrice(order.precio)} · ${new Date(order.fechaCreacion).toLocaleDateString(getLanguage() === "en" ? "en-US" : "es-CO")}</div>
        `;
      } else {
        detailsText = `
          <div>
            <strong>${t("quoteType")}:</strong> ${capitalize(order.mueble || "Mueble")} · ${order.estilo ? capitalize(order.estilo) : ""}
          </div>
          <div class="meta">${t("buyer")}: ${escapeHtml(order.nombreComprador || "—")}</div>
          <div class="meta">${order.horas ? `${order.horas} h · ` : ""}${t("deliveryDate").toLowerCase()} ${order.fechaEntrega ? new Date(order.fechaEntrega).toLocaleDateString(getLanguage() === "en" ? "en-US" : "es-CO") : "—"}</div>
        `;
      }

      div.innerHTML = `
        <div style="flex:1;">
          ${detailsText}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge pendiente">${t("pending")}</span>
          <button class="ghost small" data-order-id="${order.id}">${t("markCompleted")}</button>
        </div>`;

      div.querySelector("button").addEventListener("click", async () => {
        await markAtendido(order.id);
        loadOwnerDashboard();
      });
      list.appendChild(div);
    });
  }

  const reviews = document.getElementById("listaReviews");
  if (reviews) {
    reviews.innerHTML = ratings.length
      ? ""
      : `<p class="empty-note">${t("noRatings")}</p>`;

    ratings.slice(0, 25).forEach(rating => {
      const div = document.createElement("div");
      div.className = "review-row";
      div.innerHTML = `
        <div class="stars readonly">${"★".repeat(rating.estrellas)}${"☆".repeat(5 - rating.estrellas)}</div>
        ${rating.comentario ? `<div>${escapeHtml(rating.comentario)}</div>` : `<div class="meta">${t("noComment")}</div>`}
        <div class="meta">${new Date(rating.fecha).toLocaleDateString(getLanguage() === "en" ? "en-US" : "es-CO")}</div>`;
      reviews.appendChild(div);
    });
  }

  const reportBox = document.getElementById("reportBox");
  if (reportBox) {
    if (report) {
      reportBox.innerHTML =
        `<div class="report-box">${escapeHtml(report.texto)}</div>` +
        `<p class="meta" style="margin-top:6px;color:var(--muted);font-size:11px;">${t("generated")} ${new Date(report.fecha).toLocaleString(getLanguage() === "en" ? "en-US" : "es-CO")}</p>`;
    } else {
      reportBox.innerHTML =
        `<p class="empty-note">${t("noReport")}</p>`;
    }
  }
}

export function initOwnerDashboard() {
  window.loadOwnerDashboard = loadOwnerDashboard;
}
