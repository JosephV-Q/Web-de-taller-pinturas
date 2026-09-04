import { getLanguage, t } from "../i18n.js";
import { escapeHtml } from "../utils/helpers.js";
import { createPurchaseOrder } from "../services/orders.js";

// Estado en memoria del carrito: array de { producto_id, nombre, precio, cantidad, imagen_url, cantidad_disponible }
let cart = [];

function formatPrice(price) {
  return new Intl.NumberFormat(getLanguage() === "en" ? "en-US" : "es-CO", {
    style: "currency",
    currency: "USD"
  }).format(price);
}

export function getCart() {
  return cart;
}

export function addToCart(producto, cantidad = 1) {
  const prodId = producto.id ?? producto.producto_id;
  const cantDisponible = producto.cantidadDisponible ?? producto.cantidad_disponible ?? 0;
  const precio = typeof producto.precio === "number" ? producto.precio : parseFloat(producto.precio || 0);
  const nombre = producto.nombre || "";
  const imagenUrl = producto.imagenUrl || producto.imagen_url || null;

  const existingItem = cart.find(item => item.producto_id === prodId);

  if (existingItem) {
    const totalDeseado = existingItem.cantidad + cantidad;
    if (totalDeseado > existingItem.cantidad_disponible) {
      showCartMessage(t("stockExceeded"), "error");
      return false;
    }
    existingItem.cantidad = totalDeseado;
  } else {
    if (cantidad > cantDisponible) {
      showCartMessage(t("stockExceeded"), "error");
      return false;
    }
    cart.push({
      producto_id: prodId,
      nombre: nombre,
      precio: precio,
      cantidad: cantidad,
      imagen_url: imagenUrl,
      cantidad_disponible: cantDisponible
    });
  }

  showCartMessage(`${t("addToCart")}: ${nombre}`, "success");
  renderCart();
  return true;
}

export function updateQuantity(producto_id, nuevaCantidad) {
  const parsedQty = parseInt(nuevaCantidad, 10);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return removeFromCart(producto_id);
  }

  const item = cart.find(i => i.producto_id === producto_id);
  if (!item) return false;

  if (parsedQty > item.cantidad_disponible) {
    showCartMessage(t("stockExceeded"), "error");
    renderCart();
    return false;
  }

  item.cantidad = parsedQty;
  renderCart();
  return true;
}

export function removeFromCart(producto_id) {
  cart = cart.filter(item => item.producto_id !== producto_id);
  renderCart();
}

export function clearCart() {
  cart = [];
  renderCart();
}

function showCartMessage(msg, type = "info") {
  const box = document.getElementById("cartMessage");
  if (!box) return;
  box.textContent = msg;
  box.className = `cart-message ${type}`;
  box.style.display = "block";
  setTimeout(() => {
    if (box.textContent === msg) {
      box.style.display = "none";
    }
  }, 4000);
}

export function renderCart() {
  const container = document.getElementById("cartContainer");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="card cart-card">
        <h2 data-i18n="cartTitle">${escapeHtml(t("cartTitle"))}</h2>
        <p class="empty-note" data-i18n="cartEmpty">${escapeHtml(t("cartEmpty"))}</p>
        <div id="cartMessage" class="cart-message" style="display:none;"></div>
      </div>
    `;
    return;
  }

  let totalGeneral = 0;

  const itemsHtml = cart.map(item => {
    const subtotal = item.precio * item.cantidad;
    totalGeneral += subtotal;

    const imgTag = item.imagen_url
      ? `<img src="${escapeHtml(item.imagen_url)}" alt="${escapeHtml(item.nombre)}" class="cart-item-img">`
      : `<div class="cart-item-img-placeholder">${escapeHtml(t("noImage"))}</div>`;

    return `
      <div class="cart-item" data-id="${item.producto_id}">
        ${imgTag}
        <div class="cart-item-info">
          <h4>${escapeHtml(item.nombre)}</h4>
          <p class="cart-item-price">${formatPrice(item.precio)}</p>
        </div>
        <div class="cart-item-qty">
          <button type="button" class="qty-btn" onclick="window.cartModule.changeQty(${item.producto_id}, ${item.cantidad - 1})">-</button>
          <span class="qty-val">${item.cantidad}</span>
          <button type="button" class="qty-btn" onclick="window.cartModule.changeQty(${item.producto_id}, ${item.cantidad + 1})">+</button>
        </div>
        <div class="cart-item-subtotal">
          <span>${escapeHtml(t("subtotal"))}:</span>
          <strong>${formatPrice(subtotal)}</strong>
        </div>
        <button type="button" class="link-btn cart-remove-btn" onclick="window.cartModule.removeFromCart(${item.producto_id})">
          ${escapeHtml(t("remove"))}
        </button>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="card cart-card">
      <div class="cart-header">
        <h2 data-i18n="cartTitle">${escapeHtml(t("cartTitle"))}</h2>
        <button type="button" class="ghost small" onclick="window.cartModule.clearCart()">${escapeHtml(t("remove"))}</button>
      </div>
      <div id="cartMessage" class="cart-message" style="display:none;"></div>
      <div class="cart-items-list">
        ${itemsHtml}
      </div>
      <div class="cart-summary">
        <div class="cart-total-row">
          <span data-i18n="total">${escapeHtml(t("total"))}:</span>
          <strong class="cart-total-price">${formatPrice(totalGeneral)}</strong>
        </div>
        <button type="button" class="primary" id="btnConfirmPurchase" onclick="window.cartModule.confirmPurchase()">
          ${escapeHtml(t("confirmPurchase"))}
        </button>
      </div>
    </div>
  `;
}

export async function confirmPurchase() {
  const btn = document.getElementById("btnConfirmPurchase");
  if (!btn || cart.length === 0) return;

  // Deshabilitar inmediatamente el botón para evitar múltiples pedidos por doble clic
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = t("confirmingPurchase");

  try {
    const cartTotalCalculated = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const createdOrder = await createPurchaseOrder(cart);

    if (createdOrder && Math.abs((createdOrder.precio || 0) - cartTotalCalculated) > 0.01) {
      showCartMessage(`${t("priceChangedNotice")} (${formatPrice(createdOrder.precio)})`, "warning");
    } else {
      showCartMessage(t("purchaseSuccess"), "success");
    }

    clearCart();

    // Actualizar la tienda e historial de cliente si están disponibles
    window.loadStore?.();
    window.loadMyOrders?.();
  } catch (error) {
    showCartMessage(error.message || t("tryAgain"), "error");
  } finally {
    if (btn && cart.length > 0) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

export function initCart() {
  window.cartModule = {
    addToCart,
    updateQuantity,
    changeQty: (id, newQty) => updateQuantity(id, newQty),
    removeFromCart,
    clearCart,
    confirmPurchase,
    getCart,
    renderCart
  };
  renderCart();
}
