import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { generateReportText } from "../services/gemini.js";

const router = Router();

router.get("/", requireAuth("dueno"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT texto, generado_en AS fecha FROM informes ORDER BY generado_en DESC LIMIT 1`
  );
  res.json(rows[0] || null);
});

router.post("/generate", requireAuth("dueno"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT estrellas, comentario FROM calificaciones
     WHERE comentario IS NOT NULL AND trim(comentario) <> ''
     ORDER BY fecha DESC LIMIT 100`
  );

  if (!rows.length) {
    return res.status(400).json({
      message: "Todavía no hay suficientes comentarios de clientes para generar un informe."
    });
  }

  try {
    const texto = await generateReportText(rows);
    await pool.query(`INSERT INTO informes (texto) VALUES ($1)`, [texto]);
    res.json({ texto, fecha: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo generar el informe. Intenta de nuevo." });
  }
});

export default router;
