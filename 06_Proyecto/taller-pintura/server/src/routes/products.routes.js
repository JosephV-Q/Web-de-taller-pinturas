import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRequestLanguage, localizeCategory, localizeProduct } from "../services/localization.js";

const router = Router();

// =========================================================
// GET /api/products/categories (Obtener lista de categorías)
// =========================================================
router.get("/categories", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion FROM categorias ORDER BY nombre ASC`
    );
    res.json(rows.map(product => localizeProduct(product, getRequestLanguage(req))));
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ message: "No se pudieron obtener las categorías." });
  }
});

// =========================================================
// GET /api/products
// Público: lista productos activos (o todos si se especifica ?incluirInactivos=true)
// =========================================================
router.get("/", async (req, res) => {
  const { categoriaId, categoria_id, incluirInactivos } = req.query;
  const filterCat = categoriaId || categoria_id;

  try {
    const conditions = [];
    const params = [];

    // Por defecto solo lista productos activos para el público
    if (incluirInactivos !== "true") {
      conditions.push("p.estado = 'activo'");
    }

    if (filterCat) {
      params.push(parseInt(filterCat, 10));
      conditions.push(`p.categoria_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.categoria_id AS "categoriaId",
         c.nombre AS "categoriaNombre",
         p.nombre,
         p.descripcion,
         p.precio::float AS precio,
         p.imagen_url AS "imagenUrl",
         p.cantidad_disponible AS "cantidadDisponible",
         p.stock_minimo AS "stockMinimo",
         p.estado,
         p.fecha_creacion AS "fechaCreacion"
       FROM productos p
       JOIN categorias c ON p.categoria_id = c.id
       ${whereClause}
       ORDER BY p.id ASC`,
      params
    );

    res.json(rows.map(product => localizeProduct(product, getRequestLanguage(req))));
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "No se pudieron obtener los productos." });
  }
});

// =========================================================
// GET /api/products/low-stock
// Privado (Dueño): lista productos donde cantidad_disponible <= stock_minimo
// =========================================================
router.get("/low-stock", requireAuth("dueno"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.categoria_id AS "categoriaId",
         c.nombre AS "categoriaNombre",
         p.nombre,
         p.descripcion,
         p.precio::float AS precio,
         p.imagen_url AS "imagenUrl",
         p.cantidad_disponible AS "cantidadDisponible",
         p.stock_minimo AS "stockMinimo",
         p.estado,
         p.fecha_creacion AS "fechaCreacion"
       FROM productos p
       JOIN categorias c ON p.categoria_id = c.id
       WHERE p.cantidad_disponible <= p.stock_minimo
       ORDER BY p.id ASC`
    );
    res.json(rows.map(category => localizeCategory(category, getRequestLanguage(req))));
  } catch (error) {
    console.error("Error al obtener productos con stock bajo:", error);
    res.status(500).json({ message: "No se pudieron obtener los productos con stock bajo." });
  }
});

// =========================================================
// GET /api/products/:id
// Público: obtiene el detalle de un producto específico
// =========================================================
router.get("/:id", async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ message: "Identificador de producto inválido." });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.categoria_id AS "categoriaId",
         c.nombre AS "categoriaNombre",
         p.nombre,
         p.descripcion,
         p.precio::float AS precio,
         p.imagen_url AS "imagenUrl",
         p.cantidad_disponible AS "cantidadDisponible",
         p.stock_minimo AS "stockMinimo",
         p.estado,
         p.fecha_creacion AS "fechaCreacion"
       FROM productos p
       JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = $1`,
      [productId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    res.json(localizeProduct(rows[0], getRequestLanguage(req)));
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    res.status(500).json({ message: "No se pudo obtener el producto." });
  }
});

// =========================================================
// POST /api/products
// Privado (Dueño): crear un nuevo producto
// =========================================================
router.post("/", requireAuth("dueno"), async (req, res) => {
  const {
    categoriaId,
    categoria_id,
    nombre,
    descripcion,
    precio,
    imagenUrl,
    imagen_url,
    cantidadDisponible,
    cantidad_disponible,
    stockMinimo,
    stock_minimo,
    estado
  } = req.body || {};

  const catId = parseInt(categoriaId || categoria_id, 10);
  const nombreTrim = (nombre || "").trim();
  const numPrecio = parseFloat(precio);
  const cantDisp = parseInt(cantidadDisponible ?? cantidad_disponible ?? 0, 10);
  const stockMin = parseInt(stockMinimo ?? stock_minimo ?? 0, 10);
  const imgUrl = (imagenUrl || imagen_url || null)?.trim() || null;
  const desc = (descripcion || null)?.trim() || null;
  const est = estado === "inactivo" ? "inactivo" : "activo";

  if (!catId || isNaN(catId)) {
    return res.status(400).json({ message: "Debes seleccionar una categoría válida." });
  }
  if (!nombreTrim) {
    return res.status(400).json({ message: "El nombre del producto es obligatorio." });
  }
  if (isNaN(numPrecio) || numPrecio < 0) {
    return res.status(400).json({ message: "El precio debe ser un número mayor o igual a 0." });
  }
  if (isNaN(cantDisp) || cantDisp < 0) {
    return res.status(400).json({ message: "La cantidad disponible debe ser mayor o igual a 0." });
  }
  if (isNaN(stockMin) || stockMin < 0) {
    return res.status(400).json({ message: "El stock mínimo debe ser mayor o igual a 0." });
  }

  try {
    // Validar que la categoría exista
    const catCheck = await pool.query("SELECT id FROM categorias WHERE id = $1", [catId]);
    if (!catCheck.rows.length) {
      return res.status(400).json({ message: "La categoría especificada no existe." });
    }

    const { rows } = await pool.query(
      `INSERT INTO productos (
         categoria_id,
         nombre,
         descripcion,
         precio,
         imagen_url,
         cantidad_disponible,
         stock_minimo,
         estado
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         id,
         categoria_id AS "categoriaId",
         nombre,
         descripcion,
         precio::float AS precio,
         imagen_url AS "imagenUrl",
         cantidad_disponible AS "cantidadDisponible",
         stock_minimo AS "stockMinimo",
         estado,
         fecha_creacion AS "fechaCreacion"`,
      [catId, nombreTrim, desc, numPrecio, imgUrl, cantDisp, stockMin, est]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error al crear producto:", error);
    if (error.code === "23505") { // Violación de unicidad en Postgres
      return res.status(409).json({ message: "Ya existe un producto con ese nombre." });
    }
    res.status(500).json({ message: "No se pudo crear el producto." });
  }
});

// =========================================================
// PUT /api/products/:id
// Privado (Dueño): actualizar un producto existente
// =========================================================
router.put("/:id", requireAuth("dueno"), async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ message: "Identificador de producto inválido." });
  }

  const {
    categoriaId,
    categoria_id,
    nombre,
    descripcion,
    precio,
    imagenUrl,
    imagen_url,
    cantidadDisponible,
    cantidad_disponible,
    stockMinimo,
    stock_minimo,
    estado
  } = req.body || {};

  try {
    // Verificar si el producto existe
    const existing = await pool.query("SELECT * FROM productos WHERE id = $1", [productId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }
    const current = existing.rows[0];

    const catId = categoriaId !== undefined || categoria_id !== undefined
      ? parseInt(categoriaId ?? categoria_id, 10)
      : current.categoria_id;

    if (isNaN(catId)) {
      return res.status(400).json({ message: "Categoría inválida." });
    }

    if (catId !== current.categoria_id) {
      const catCheck = await pool.query("SELECT id FROM categorias WHERE id = $1", [catId]);
      if (!catCheck.rows.length) {
        return res.status(400).json({ message: "La categoría especificada no existe." });
      }
    }

    const finalNombre = nombre !== undefined ? (nombre || "").trim() : current.nombre;
    if (!finalNombre) {
      return res.status(400).json({ message: "El nombre no puede estar vacío." });
    }

    const finalPrecio = precio !== undefined ? parseFloat(precio) : parseFloat(current.precio);
    if (isNaN(finalPrecio) || finalPrecio < 0) {
      return res.status(400).json({ message: "El precio debe ser un número mayor o igual a 0." });
    }

    const finalCant = cantidadDisponible !== undefined || cantidad_disponible !== undefined
      ? parseInt(cantidadDisponible ?? cantidad_disponible, 10)
      : current.cantidad_disponible;
    if (isNaN(finalCant) || finalCant < 0) {
      return res.status(400).json({ message: "La cantidad disponible debe ser mayor o igual a 0." });
    }

    const finalStockMin = stockMinimo !== undefined || stock_minimo !== undefined
      ? parseInt(stockMinimo ?? stock_minimo, 10)
      : current.stock_minimo;
    if (isNaN(finalStockMin) || finalStockMin < 0) {
      return res.status(400).json({ message: "El stock mínimo debe ser mayor o igual a 0." });
    }

    const finalDesc = descripcion !== undefined ? ((descripcion || "").trim() || null) : current.descripcion;
    const finalImg = (imagenUrl !== undefined || imagen_url !== undefined)
      ? (((imagenUrl ?? imagen_url) || "").trim() || null)
      : current.imagen_url;

    let finalEstado = current.estado;
    if (estado !== undefined) {
      if (!["activo", "inactivo"].includes(estado)) {
        return res.status(400).json({ message: "Estado inválido. Debe ser 'activo' o 'inactivo'." });
      }
      finalEstado = estado;
    }

    const { rows } = await pool.query(
      `UPDATE productos
       SET
         categoria_id = $1,
         nombre = $2,
         descripcion = $3,
         precio = $4,
         imagen_url = $5,
         cantidad_disponible = $6,
         stock_minimo = $7,
         estado = $8
       WHERE id = $9
       RETURNING
         id,
         categoria_id AS "categoriaId",
         nombre,
         descripcion,
         precio::float AS precio,
         imagen_url AS "imagenUrl",
         cantidad_disponible AS "cantidadDisponible",
         stock_minimo AS "stockMinimo",
         estado,
         fecha_creacion AS "fechaCreacion"`,
      [catId, finalNombre, finalDesc, finalPrecio, finalImg, finalCant, finalStockMin, finalEstado, productId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Ya existe otro producto con ese nombre." });
    }
    res.status(500).json({ message: "No se pudo actualizar el producto." });
  }
});

// =========================================================
// DELETE /api/products/:id
// Privado (Dueño): Elimina el producto o aplica soft-delete (inactivo)
// si tiene pedidos asociados en detalle_pedido
// =========================================================
router.delete("/:id", requireAuth("dueno"), async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ message: "Identificador de producto inválido." });
  }

  try {
    // 1. Verificar existencia del producto
    const checkProduct = await pool.query("SELECT id, nombre, estado FROM productos WHERE id = $1", [productId]);
    if (!checkProduct.rows.length) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    // 2. Verificar si tiene pedidos asociados en detalle_pedido
    const checkOrders = await pool.query(
      "SELECT COUNT(*)::int AS count FROM detalle_pedido WHERE producto_id = $1",
      [productId]
    );
    const hasOrders = checkOrders.rows[0].count > 0;

    if (hasOrders) {
      // Soft delete: cambiar estado a 'inactivo' para preservar el historial de pedidos
      await pool.query("UPDATE productos SET estado = 'inactivo' WHERE id = $1", [productId]);
      return res.json({
        ok: true,
        softDeleted: true,
        message: "El producto tiene compras/pedidos asociados en el historial. Se ha desactivado (soft delete) para proteger los registros."
      });
    }

    // Borrado físico si no tiene dependencias
    await pool.query("DELETE FROM productos WHERE id = $1", [productId]);
    res.json({
      ok: true,
      softDeleted: false,
      message: "Producto eliminado correctamente."
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ message: "No se pudo eliminar el producto." });
  }
});

export default router;
