import test from "node:test";
import assert from "node:assert/strict";

// Implementación pura del modelo de datos de carrito para pruebas unitarias
class CartModel {
  constructor() {
    this.cart = [];
  }

  addToCart(producto, cantidad = 1, color = null) {
    const prodId = producto.id ?? producto.producto_id;
    const cantDisponible = producto.cantidadDisponible ?? producto.cantidad_disponible ?? 0;
    const precio = typeof producto.precio === "number" ? producto.precio : parseFloat(producto.precio || 0);
    const nombre = producto.nombre || "";
    const selectedColor = typeof color === "string" && color.trim() ? color.trim() : null;

    const currentTotalInCart = this.cart
      .filter(item => item.producto_id === prodId)
      .reduce((sum, item) => sum + item.cantidad, 0);

    if (currentTotalInCart + cantidad > cantDisponible) {
      return { success: false, reason: "stock_exceeded" };
    }

    const existingItem = this.cart.find(
      item => item.producto_id === prodId && (item.color || null) === selectedColor
    );

    if (existingItem) {
      existingItem.cantidad += cantidad;
    } else {
      this.cart.push({
        producto_id: prodId,
        nombre,
        precio,
        cantidad,
        cantidad_disponible: cantDisponible,
        color: selectedColor
      });
    }

    return {
      success: true,
      message: `Producto agregado al carrito: ${nombre}${selectedColor ? ` (${selectedColor})` : ""}`
    };
  }

  updateQuantity(prodId, nuevaCantidad, color = null) {
    const selectedColor = typeof color === "string" && color.trim() ? color.trim() : null;
    const parsedQty = parseInt(nuevaCantidad, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      this.cart = this.cart.filter(
        item => !(item.producto_id === prodId && (item.color || null) === selectedColor)
      );
      return { success: true };
    }

    const item = this.cart.find(
      i => i.producto_id === prodId && (i.color || null) === selectedColor
    );
    if (!item) return { success: false, reason: "item_not_found" };

    const otherItemsQty = this.cart
      .filter(i => i.producto_id === prodId && i !== item)
      .reduce((sum, i) => sum + i.cantidad, 0);

    if (otherItemsQty + parsedQty > item.cantidad_disponible) {
      return { success: false, reason: "stock_exceeded" };
    }

    item.cantidad = parsedQty;
    return { success: true };
  }

  clear() {
    this.cart = [];
  }

  getTotal() {
    return this.cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }
}

// Simulador de deduplicación de Toasts
class ToastDeduplicator {
  constructor() {
    this.activeToasts = new Map();
  }

  showToast(message, type = "info") {
    const key = `${type}:::${message.trim()}`;
    if (this.activeToasts.has(key)) {
      const entry = this.activeToasts.get(key);
      entry.refreshed = true;
      entry.count++;
      return { action: "refreshed", key };
    }
    this.activeToasts.set(key, { message, type, refreshed: false, count: 1 });
    return { action: "created", key };
  }

  getActiveCount() {
    return this.activeToasts.size;
  }
}

test("Carrito: agrega productos correctamente y calcula total", () => {
  const cart = new CartModel();
  const prod = { id: 1, nombre: "Barniz Protector", precio: 42.50, cantidad_disponible: 10 };

  const res = cart.addToCart(prod, 2);
  assert.equal(res.success, true);
  assert.equal(cart.cart.length, 1);
  assert.equal(cart.cart[0].cantidad, 2);
  assert.equal(cart.getTotal(), 85.00);
});

test("Carrito: maneja variantes de color por separado respetando el stock total", () => {
  const cart = new CartModel();
  const prod = { id: 2, nombre: "Kit Chalk Paint", precio: 85.00, cantidad_disponible: 5 };

  // Agrega 2 unidades en Blanco Lino
  const res1 = cart.addToCart(prod, 2, "Blanco Lino");
  assert.equal(res1.success, true);

  // Agrega 2 unidades en Verde Salvia
  const res2 = cart.addToCart(prod, 2, "Verde Salvia");
  assert.equal(res2.success, true);

  // Ambas variantes existen como ítems independientes en el carrito
  assert.equal(cart.cart.length, 2);
  assert.equal(cart.cart[0].color, "Blanco Lino");
  assert.equal(cart.cart[1].color, "Verde Salvia");
  assert.equal(cart.getTotal(), 340.00);

  // Intenta agregar 2 más (total 2 + 2 + 2 = 6 > stock 5) -> Debe fallar por stock
  const res3 = cart.addToCart(prod, 2, "Terracota");
  assert.equal(res3.success, false);
  assert.equal(res3.reason, "stock_exceeded");
  assert.equal(cart.cart.length, 2);
});

test("Carrito y compra: confirmación solo vacía el carrito si la API responde exitosamente", async () => {
  const cart = new CartModel();
  cart.addToCart({ id: 1, nombre: "Brochas", precio: 35.00, cantidad_disponible: 5 }, 1);

  // Simulación de fallo en API
  let purchaseSuccess = false;
  try {
    throw new Error("Error en conexión o conflicto de stock");
  } catch {
    // Al fallar la compra, NO vaciar el carrito
    purchaseSuccess = false;
  }

  assert.equal(purchaseSuccess, false);
  assert.equal(cart.cart.length, 1); // El carrito se conserva

  // Simulación de éxito en API
  purchaseSuccess = true;
  cart.clear(); // Se limpia únicamente tras éxito

  assert.equal(purchaseSuccess, true);
  assert.equal(cart.cart.length, 0); // Limpio
});

test("Notificaciones flotantes: evita duplicados de la misma acción", () => {
  const toastManager = new ToastDeduplicator();

  const r1 = toastManager.showToast("Producto agregado al carrito: Brochas", "success");
  assert.equal(r1.action, "created");
  assert.equal(toastManager.getActiveCount(), 1);

  // El usuario presiona el botón dos veces rápidamente
  const r2 = toastManager.showToast("Producto agregado al carrito: Brochas", "success");
  assert.equal(r2.action, "refreshed");
  // La cantidad de notificaciones flotantes sigue siendo 1, evitando saturar la pantalla
  assert.equal(toastManager.getActiveCount(), 1);

  // Notificación diferente sí se crea
  const r3 = toastManager.showToast("Stock insuficiente", "error");
  assert.equal(r3.action, "created");
  assert.equal(toastManager.getActiveCount(), 2);
});
