import { getProducts } from "../services/products.js";
import { getLanguage, t } from "../i18n.js";
import { escapeHtml } from "../utils/helpers.js";
import { addToCart } from "../cart/cart.js";

function formatPrice(price) {
  return new Intl.NumberFormat(getLanguage() === "en" ? "en-US" : "es-CO", {
    style: "currency", currency: "USD"
  }).format(price);
}

export async function loadStore() {
  const container = document.getElementById("clientProducts");
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
      const actionHtml = isOutOfStock
        ? `<button type="button" class="primary small" disabled>${escapeHtml(t("outOfStock"))}</button>`
        : `
          <div class="product-add-cart-wrap">
            <input type="number" min="1" max="${product.cantidadDisponible}" value="1" id="qty_${product.id}" class="product-qty-input">
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
            addToCart(product, isNaN(qty) || qty < 1 ? 1 : qty);
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
  document.getElementById("refreshStore").addEventListener("click", loadStore);
}