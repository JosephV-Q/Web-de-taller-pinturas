import { apiFetch } from "../config/api.js";

export function getProducts({ includeInactive = false } = {}) {
  return apiFetch(`/products${includeInactive ? "?incluirInactivos=true" : ""}`);
}

export function getProductCategories() {
  return apiFetch("/products/categories");
}

export function createProduct(product) {
  return apiFetch("/products", { method: "POST", body: product, auth: true });
}

export function updateProduct(id, product) {
  return apiFetch(`/products/${id}`, { method: "PUT", body: product, auth: true });
}

export function deleteProduct(id) {
  return apiFetch(`/products/${id}`, { method: "DELETE", auth: true });
}

export function getLowStockProducts() {
  return apiFetch("/products/low-stock", { auth: true });
}