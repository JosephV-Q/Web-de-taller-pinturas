import { apiFetch } from "../config/api.js";

// Lecturas del panel del dueño (requieren sesión con rol "dueno").
export async function getOrders() {
  return apiFetch("/orders", { auth: true });
}

export async function getRatings() {
  return apiFetch("/ratings", { auth: true });
}

export async function getReport() {
  return apiFetch("/report", { auth: true });
}

export async function getAdminStats() {
  return apiFetch("/stats/admin", { auth: true });
}

// Estadísticas públicas para el banner del cliente (sin autenticación).
export async function getPublicStats() {
  return apiFetch("/stats/public");
}
