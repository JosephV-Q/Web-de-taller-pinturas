import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/public", async (req, res) => {
  try {
    const [avg, count] = await Promise.all([
      pool.query(`SELECT AVG(estrellas)::float AS promedio FROM calificaciones`),
      pool.query(`SELECT COUNT(*)::int AS atendidos FROM pedidos WHERE estado = 'atendido'`)
    ]);
    res.json({ promedio: avg.rows[0].promedio, atendidos: count.rows[0].atendidos });
  } catch (error) {
    console.error("Error al obtener estadísticas públicas:", error);
    res.status(500).json({ message: "No se pudieron obtener las estadísticas públicas." });
  }
});

// =========================================================
// GET /api/stats/admin
// Privado (Dueño): Obtiene conteos generales para el dashboard
// =========================================================
router.get("/admin", requireAuth("dueno"), async (req, res) => {
  try {
    const [usuariosRes, productosRes, pedidosRes, stockBajoRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS "totalUsuarios" FROM usuarios`),
      pool.query(`SELECT COUNT(*)::int AS "totalProductos" FROM productos`),
      pool.query(`SELECT COUNT(*)::int AS "totalPedidos" FROM pedidos`),
      pool.query(`SELECT COUNT(*)::int AS "stockBajo" FROM productos WHERE cantidad_disponible <= stock_minimo`)
    ]);

    res.json({
      totalUsuarios: usuariosRes.rows[0].totalUsuarios,
      totalProductos: productosRes.rows[0].totalProductos,
      totalPedidos: pedidosRes.rows[0].totalPedidos,
      stockBajo: stockBajoRes.rows[0].stockBajo
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de administración:", error);
    res.status(500).json({ message: "No se pudieron obtener las estadísticas administrativas." });
  }
});

export default router;

