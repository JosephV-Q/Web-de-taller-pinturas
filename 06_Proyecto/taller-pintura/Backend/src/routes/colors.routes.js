import { Router } from "express";
import { pool } from "../db.js";
import { DEFAULT_COLORS } from "../services/colors.js";

const router = Router();

export { DEFAULT_COLORS };

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, hex, descripcion FROM colores WHERE activo = TRUE ORDER BY id ASC`
    );
    if (rows && rows.length > 0) {
      return res.json(rows);
    }
    return res.json(DEFAULT_COLORS);
  } catch {
    // Si la tabla no ha sido creada o la base de datos no está disponible,
    // se entrega el catálogo estándar por defecto sin interrumpir el flujo.
    return res.json(DEFAULT_COLORS);
  }
});

export default router;
