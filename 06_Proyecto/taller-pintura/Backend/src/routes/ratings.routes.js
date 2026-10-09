import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Calificación desde la app (cliente logueado): solo pedidos propios y ya atendidos, una vez.
router.post("/", requireAuth(), async (req, res) => {
  const { estrellas, comentario, pedidoId } = req.body || {};
  const stars = parseInt(estrellas, 10);
  const pedido = parseInt(pedidoId, 10);

  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "Calificación inválida." });
  }
  if (!pedido) {
    return res.status(400).json({ message: "Falta el identificador del pedido." });
  }

  try {
    const { rowCount } = await pool.query(
      `INSERT INTO calificaciones (usuario_id, pedido_id, estrellas, comentario)
       SELECT p.usuario_id, p.id, $3::smallint, $4::text
       FROM pedidos p
       WHERE p.id = $2 AND p.usuario_id = $1 AND p.estado = 'atendido'
       ON CONFLICT (pedido_id) DO NOTHING`,
      [req.user.sub, pedido, stars, (comentario || "").trim().slice(0, 1000) || null]
    );
    if (!rowCount) {
      return res.status(409).json({ message: "Este pedido aún no está atendido o ya fue calificado." });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo guardar la calificación." });
  }
});

// Público: datos mínimos del pedido para mostrar en la página de calificación
router.get("/public/:token", async (req, res) => {
  if (!UUID_RE.test(req.params.token)) return res.status(404).json({ message: "Enlace inválido." });
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.tipo_pedido AS "tipoPedido", p.mueble, p.estado,
              split_part(u.nombre, ' ', 1) AS nombre,
              EXISTS (SELECT 1 FROM calificaciones c WHERE c.pedido_id = p.id) AS "yaCalificado"
       FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.calificacion_token = $1`,
      [req.params.token]
    );
    if (!rows.length) return res.status(404).json({ message: "Enlace inválido." });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo cargar el pedido." });
  }
});

// Público: guardar la calificación usando el token del correo
router.post("/public/:token", async (req, res) => {
  if (!UUID_RE.test(req.params.token)) return res.status(404).json({ message: "Enlace inválido." });
  const stars = parseInt(req.body?.estrellas, 10);
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "Calificación inválida." });
  }
  const comentario = (req.body?.comentario || "").trim().slice(0, 1000) || null;

  try {
    const { rowCount } = await pool.query(
      `INSERT INTO calificaciones (usuario_id, pedido_id, estrellas, comentario)
       SELECT p.usuario_id, p.id, $2::smallint, $3::text
       FROM pedidos p
       WHERE p.calificacion_token = $1 AND p.estado = 'atendido'
       ON CONFLICT (pedido_id) DO NOTHING`,
      [req.params.token, stars, comentario]
    );
    if (!rowCount) {
      return res.status(409).json({ message: "Este pedido ya fue calificado o aún no está atendido." });
    }
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
