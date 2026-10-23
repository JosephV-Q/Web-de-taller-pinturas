import { getProducts } from "../services/products.js";
import { getLanguage, t } from "../i18n.js";
import { escapeHtml } from "../utils/helpers.js";
import { addToCart } from "../cart/cart.js";

function formatPrice(price) {
  return new Intl.NumberFormat(getLanguage() === "en" ? "en-US" : "es-CO", {
    style: "currency",
    currency: "USD"
  }).format(price);
}

const DEFAULT_STORE_COLORS = [
  "Blanco Lino",
  "Verde Salvia",
  "Terracota",
  "Nogal Clásico",
  "Roble Natural",
  "Gris Carbón"
];

export async function loadStore() {
  const container = document.getElementById("clientProducts");
  if (!container) return;
  container.innerHTML = `<p class="empty-note">${t("loadingProducts")}</p>`;

  try {
    const products = await getProducts();
    container.innerHTML = products.length ? "" : `<p class="empty-note">${t("noProducts")}</p>`;

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "product-card";
      const image = product.imagenUrl
        ? `<img src="${escapeHtml(product.imagenUrl)}" alt="${escapeHtml(product.nombre)}" loading="lazy">`
        : `<div class="product-image-placeholder">${t("noImage")}</div>`;

      const isOutOfStock = (product.cantidadDisponible ?? 0) <= 0;

      // Determinar si el producto permite elegir color o tonalidad de pintura
      const isPaintOrKit =
        (product.categoriaNombre && product.categoriaNombre.toLowerCase().includes("pintura")) ||
        (product.nombre && product.nombre.toLowerCase().includes("chalk paint")) ||
        (product.descripcion && (
          product.descripcion.toLowerCase().includes("color a elección") ||
          product.descripcion.toLowerCase().includes("color a eleccion") ||
          product.descripcion.toLowerCase().includes("color of your choice")
        ));

      const colorOptionsHtml = isPaintOrKit
        ? `
          <div class="product-color-wrap">
            <label for="color_${product.id}" class="product-color-label">${escapeHtml(t("colorOrTone"))}:</label>
            <select id="color_${product.id}" class="product-color-select" aria-label="${escapeHtml(t("colorOrTone"))}">
              ${DEFAULT_STORE_COLORS.map(c => `<option value="${c}">${c}</option>`).join("")}
            </select>
          </div>
        `
        : "";

      const actionHtml = isOutOfStock
        ? `<button type="button" class="primary small" disabled>${escapeHtml(t("outOfStock"))}</button>`
        : `
          ${colorOptionsHtml}
          <div class="product-add-cart-wrap">
            <input type="number" min="1" max="${product.cantidadDisponible}" value="1" id="qty_${product.id}" class="product-qty-input" aria-label="${escapeHtml(t("quantity"))}">
            <button type="button" class="primary small btn-add-to-cart" data-id="${product.id}">
              ${escapeHtml(t("addToCart"))}
            </button>
          </div>
        `;

      card.innerHTML = `
        ${image}
        <div class="product-card-body">
          <h3>${escapeHtml(product.nombre)}</h3>
          <p class="product-description">${escapeHtml(product.descripcion || "")}</p>
          <div class="product-card-footer">
            <strong>${formatPrice(product.precio)}</strong>
            <span class="badge disponible">${t("available")}: ${product.cantidadDisponible}</span>
          </div>
          <div class="product-card-actions">
            ${actionHtml}
          </div>
        </div>
      `;

      if (!isOutOfStock) {
        const btnAdd = card.querySelector(`.btn-add-to-cart[data-id="${product.id}"]`);
        if (btnAdd) {
          btnAdd.addEventListener("click", () => {
            const qtyInput = card.querySelector(`#qty_${product.id}`);
            const qty = parseInt(qtyInput?.value || "1", 10);
            const colorSelect = card.querySelector(`#color_${product.id}`);
            const selectedColor = colorSelect ? colorSelect.value : null;

            addToCart(product, isNaN(qty) || qty < 1 ? 1 : qty, selectedColor);
          });
        }
      }

      container.appendChild(card);
    });
  } catch (error) {
    const message = error instanceof TypeError || error.message === "Failed to fetch"
      ? t("storeConnectionError")
      : (error.message || t("productsError"));
    container.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
  }
}

export function initStore() {
  window.loadStore = loadStore;
  const btnRefresh = document.getElementById("refreshStore");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", loadStore);
  }
}
