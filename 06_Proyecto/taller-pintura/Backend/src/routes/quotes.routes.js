import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { analyzeFurnitureImage } from "../services/gemini.js";
import { computeQuote, addBusinessDays, CAPACIDAD_HORAS_POR_DIA } from "../services/pricing.js";

const router = Router();

router.post("/", requireAuth(), async (req, res) => {
  const { imageBase64, mediaType, estilo, color } = req.body || {};

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ message: "Falta la imagen del mueble." });
  }
  if (!["natural", "rallado", "solo_color"].includes(estilo)) {
    return res.status(400).json({ message: "Estilo inválido." });
  }
  if (["rallado", "solo_color"].includes(estilo) && (!color || typeof color !== "string" || !color.trim())) {
    return res.status(400).json({ message: "Debes seleccionar un color o tonalidad para este estilo." });
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

    let dbTamano = "mediano";
    if (analysis.tamano === "pequeño" || analysis.tamano === "pequeno") {
      dbTamano = "pequeno";
    } else if (analysis.tamano === "grande") {
      dbTamano = "grande";
    }

    const selectedColor = ["rallado", "solo_color"].includes(estilo) && color ? color.trim().slice(0, 100) : null;

    const { rows } = await pool.query(
      `INSERT INTO pedidos (usuario_id, tipo_pedido, mueble, tamano, dificultad, estilo, color, precio, horas, estado, fecha_entrega)
       VALUES ($1, 'cotizacion', $2, $3, $4, $5, $6, $7, $8, 'pendiente', $9)
       RETURNING id`,
      [req.user.sub, analysis.tipo_mueble, dbTamano, analysis.dificultad, estilo, selectedColor, quote.precio, quote.horas, deliveryDate]
    );

    res.json({
      analysis,
      quote,
      queueInfo: { pendingHoursBefore: pendingBefore, deliveryDate },
      orderId: rows[0].id,
      color: selectedColor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "No se pudo generar la cotización." });
  }
});

export default router;
