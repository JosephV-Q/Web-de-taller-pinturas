import { apiFetch } from "../config/api.js";

export async function markAtendido(id) {
  return apiFetch(`/orders/${id}/atendido`, { method: "PATCH", auth: true });
}

export async function createPurchaseOrder(cartItems) {
  const items = cartItems.map(item => ({
    producto_id: item.producto_id ?? item.productoId ?? item.id,
    cantidad: item.cantidad
  }));
  return apiFetch("/orders", {
    method: "POST",
    body: { items },
    auth: true
  });
}

export async function getMyOrders() {
  return apiFetch("/orders/mine", { auth: true });
}
