import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body || {};

  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({ message: "Ingresa tu nombre completo." });
  }
  if (!EMAIL_RE.test(email || "")) {
    return res.status(400).json({ message: "Ingresa un correo electrónico válido." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const existing = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "Ya existe una cuenta con ese correo." });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)`,
      [nombre.trim(), email, hash, "cliente"]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo crear la cuenta. Intenta de nuevo." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, password_hash, rol FROM usuarios WHERE email = $1",
      [email]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    const valid = await bcrypt.compare(password || "", user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    const userRole = user.rol;
    const token = jwt.sign({ sub: user.id, rol: userRole }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ ok: true, token, rol: userRole, nombre: user.nombre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo iniciar sesión. Intenta de nuevo." });
  }
});

router.get("/me", requireAuth(), async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const { rows } = await pool.query(
      "SELECT id, nombre, email, rol FROM usuarios WHERE id = $1",
      [userId]
    );
    if (!rows.length) {
      return res.status(401).json({ message: "Usuario no encontrado." });
    }
    const user = rows[0];
    res.json({ ok: true, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (error) {
    console.error("Error en GET /auth/me:", error);
    res.status(500).json({ message: "Error al verificar sesión." });
  }
});

export default router;
