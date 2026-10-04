import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { analyzeFurnitureImage } from "../services/gemini.js";
import { computeQuote, addBusinessDays, CAPACIDAD_HORAS_POR_DIA } from "../services/pricing.js";

const router = Router();

router.post("/", requireAuth(), async (req, res) => {
  const { imageBase64, mediaType, estilo } = req.body || {};

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ message: "Falta la imagen del mueble." });
  }
  if (!["natural", "rallado"].includes(estilo)) {
    return res.status(400).json({ message: "Estilo inválido." });
  }

  try {
    const analysis = await analyzeFurnitureImage(imageBase64, mediaType);

    if (!["pequeño", "mediano", "grande"].includes(analysis.tamano)) {
      analysis.tamano = "mediano";
    }
    analysis.dificultad = Math.min(5, Math.max(1, parseInt(analysis.dificultad) || 3));

    const quote = computeQuote(analysis, estilo);

    const { rows: pendingRows } = await pool.query(
      `SELECT COALESCE(SUM(horas), 0) AS horas FROM pedidos WHERE estado = 'pendiente'`
    );
    const pendingBefore = Number(pendingRows[0].horas);
    const deliveryDate = addBusinessDays(new Date(), pendingBefore + quote.horas, CAPACIDAD_HORAS_POR_DIA);

    const { rows } = await pool.query(
      `INSERT INTO pedidos (usuario_id, mueble, tamano, dificultad, estilo, precio, horas, estado, fecha_entrega)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', $8)
       RETURNING id`,
      [req.user.sub, analysis.tipo_mueble, analysis.tamano, analysis.dificultad, estilo, quote.precio, quote.horas, deliveryDate]
    );

    res.json({
      analysis,
      quote,
      queueInfo: { pendingHoursBefore: pendingBefore, deliveryDate },
      orderId: rows[0].id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "No se pudo generar la cotización." });
  }
});

export default router;
