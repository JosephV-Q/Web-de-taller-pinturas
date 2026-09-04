import { apiFetch, setSession } from "../config/api.js";

export async function loginUser({ email, password }) {
  try {
    const data = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
    setSession({ token: data.token, rol: data.rol, nombre: data.nombre });
    return { ok: true, rol: data.rol };
  } catch (error) {
    return { ok: false, code: "ERROR", message: error.message };
  }
}

export async function registerUser({ nombre, email, password, rol }) {
  try {
    await apiFetch("/auth/register", { method: "POST", body: { nombre, email, password, rol } });
    return { ok: true };
  } catch (error) {
    return { ok: false, code: "ERROR", message: error.message };
  }
}
