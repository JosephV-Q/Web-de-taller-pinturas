import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth(), async (req, res) => {
  const { estrellas, comentario, pedidoId } = req.body || {};
  const stars = parseInt(estrellas);

  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "Calificación inválida." });
  }
  if (!pedidoId) {
    return res.status(400).json({ message: "Falta el identificador del pedido." });
  }

  try {
    await pool.query(
      `INSERT INTO calificaciones (usuario_id, pedido_id, estrellas, comentario) VALUES ($1, $2, $3, $4)`,
      [req.user.sub, pedidoId, stars, comentario || null]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo guardar la calificación." });
  }
});

router.get("/", requireAuth("dueno"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, estrellas, comentario, fecha, pedido_id AS "pedidoId"
       FROM calificaciones ORDER BY fecha DESC LIMIT 200`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo obtener las calificaciones." });
  }
});

export default router;
