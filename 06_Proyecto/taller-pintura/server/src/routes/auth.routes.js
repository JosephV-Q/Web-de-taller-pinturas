import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  const { nombre, email, password, rol } = req.body || {};

  if (!nombre || nombre.trim().length < 3) {
    return res.status(400).json({ message: "Ingresa tu nombre completo." });
  }
  if (!EMAIL_RE.test(email || "")) {
    return res.status(400).json({ message: "Ingresa un correo electrónico válido." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });
  }

  let finalRole = "cliente";
  if (rol === "dueño" || rol === "dueno") {
    finalRole = "dueno";
  }

  try {
    const existing = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "Ya existe una cuenta con ese correo." });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4)`,
      [nombre.trim(), email, hash, finalRole]
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

export default router;
