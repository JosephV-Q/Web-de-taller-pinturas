// Punto único de comunicación con el backend.
// En desarrollo, "/api" es redirigido al backend por el proxy de Vite
// (ver vite.config.js). En producción, define VITE_API_BASE_URL apuntando
// a la URL pública del backend (ver README-BACKEND.md).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const TOKEN_KEY = "taller_token";
const ROL_KEY = "taller_rol";
const NOMBRE_KEY = "taller_nombre";

export function setSession({ token, rol, nombre }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (rol) localStorage.setItem(ROL_KEY, rol);
  if (nombre) localStorage.setItem(NOMBRE_KEY, nombre);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROL_KEY);
  localStorage.removeItem(NOMBRE_KEY);
}

export function getRol() {
  return localStorage.getItem(ROL_KEY);
}

export async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": localStorage.getItem("language") || "es"
  };

  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Error de comunicación con el servidor.");
  }

  return data;
}
