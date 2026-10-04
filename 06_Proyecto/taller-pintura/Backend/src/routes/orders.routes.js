import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRequestLanguage, localizeOrder } from "../services/localization.js";

const router = Router();

// =========================================================
// POST /api/orders
// Privado (Cliente/Dueño): Crear pedido de compra de catálogo dentro de transacción SQL
// =========================================================
router.post("/", requireAuth(), async (req, res) => {
  const { items } = req.body || {};

  // Validaciones previas a tocar la base de datos (400 Bad Request)
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "El carrito de compras no contiene productos." });
  }

  // Consolidar e inspeccionar ítems duplicados en el mismo array
  const consolidatedMap = new Map();

  for (const item of items) {
    const prodId = parseInt(item.producto_id ?? item.productoId, 10);
    const cant = parseInt(item.cantidad, 10);

    if (isNaN(prodId) || prodId <= 0) {
      return res.status(400).json({ message: "Se especificó un identificador de producto inválido." });
    }
    if (isNaN(cant) || cant <= 0) {
      return res.status(400).json({ message: "La cantidad solicitada debe ser un número entero mayor a 0." });
    }

    if (consolidatedMap.has(prodId)) {
      consolidatedMap.set(prodId, consolidatedMap.get(prodId) + cant);
    } else {
      consolidatedMap.set(prodId, cant);
    }
  }

  const consolidatedItems = Array.from(consolidatedMap.entries()).map(([producto_id, cantidad]) => ({
    producto_id,
    cantidad
  }));

  const usuarioId = req.user.sub || req.user.id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalCalculado = 0;
    const validatedProducts = [];

    // a) SELECT FOR UPDATE por producto y verificaciones (existencia, estado activo, stock)
    for (const item of consolidatedItems) {
      const { rows } = await client.query(
        `SELECT id, nombre, precio, cantidad_disponible, estado
         FROM productos
         WHERE id = $1
         FOR UPDATE`,
        [item.producto_id]
      );

      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: `El producto especificado (ID ${item.producto_id}) ya no existe.` });
      }

      const p = rows[0];

      if (p.estado !== "activo") {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: `El producto '${p.nombre}' está inactivo y no se puede comprar.` });
      }

      if (p.cantidad_disponible < item.cantidad) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: `Stock insuficiente para '${p.nombre}'. Disponible: ${p.cantidad_disponible}, solicitado: ${item.cantidad}.`
        });
      }

      const precioUnitario = parseFloat(p.precio);
      totalCalculado += precioUnitario * item.cantidad;

      validatedProducts.push({
        producto_id: p.id,
        nombre: p.nombre,
        precio_unitario: precioUnitario,
        cantidad: item.cantidad
      });
    }

    // b) UPDATE productos SET cantidad_disponible con doble chequeo de concurrencia
    for (const item of validatedProducts) {
      const updateRes = await client.query(
        `UPDATE productos
         SET cantidad_disponible = cantidad_disponible - $1
         WHERE id = $2 AND cantidad_disponible >= $1`,
        [item.cantidad, item.producto_id]
      );

      if (updateRes.rowCount !== 1) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: `Ocurrió un conflicto de concurrencia al actualizar el inventario del producto '${item.nombre}'. Intenta de nuevo.`
        });
      }
    }

    // d) Insertar registro en pedidos (tipo_pedido = 'compra', estado = 'pendiente')
    const { rows: orderRows } = await client.query(
      `INSERT INTO pedidos (usuario_id, tipo_pedido, precio, estado)
       VALUES ($1, 'compra', $2, 'pendiente')
       RETURNING id, usuario_id AS "usuarioId", tipo_pedido AS "tipoPedido", precio::float AS precio, estado, fecha_creacion AS "fechaCreacion"`,
      [usuarioId, totalCalculado]
    );
    const newOrder = orderRows[0];

    // e) Insertar filas en detalle_pedido con el precio histórico leído en el paso (a)
    const details = [];
    for (const item of validatedProducts) {
      const { rows: detailRows } = await client.query(
        `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)
         RETURNING id, pedido_id AS "pedidoId", producto_id AS "productoId", cantidad, precio_unitario::float AS "precioUnitario"`,
        [newOrder.id, item.producto_id, item.cantidad, item.precio_unitario]
      );
      details.push({
        ...detailRows[0],
        productoNombre: item.nombre
      });
    }

    await client.query("COMMIT");

    res.status(201).json({
      ...newOrder,
      detalle: details
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al procesar pedido de compra:", error);
    res.status(500).json({ message: "No se pudo procesar la compra." });
  } finally {
    client.release();
  }
});

// =========================================================
// GET /api/orders/mine
// Privado (Cliente): Obtener historial de pedidos del usuario autenticado
// =========================================================
router.get("/mine", requireAuth(), async (req, res) => {
  const usuarioId = req.user.sub || req.user.id;

  try {
    const { rows: orders } = await pool.query(
      `SELECT
         p.id,
         p.usuario_id AS "usuarioId",
         p.tipo_pedido AS "tipoPedido",
         p.mueble,
         p.tamano,
         p.dificultad,
         p.estilo,
         p.precio::float AS precio,
         p.horas,
         p.estado,
         p.fecha_creacion AS "fechaCreacion",
         p.fecha_entrega AS "fechaEntrega"
       FROM pedidos p
       WHERE p.usuario_id = $1
       ORDER BY p.fecha_creacion DESC`,
      [usuarioId]
    );

    const purchaseOrderIds = orders.filter(o => o.tipoPedido === "compra").map(o => o.id);

    let detailsMap = new Map();
    if (purchaseOrderIds.length > 0) {
      const { rows: details } = await pool.query(
        `SELECT
           d.id,
           d.pedido_id AS "pedidoId",
           d.producto_id AS "productoId",
           pr.nombre AS "productoNombre",
           pr.imagen_url AS "imagenUrl",
           d.cantidad,
           d.precio_unitario::float AS "precioUnitario"
         FROM detalle_pedido d
         JOIN productos pr ON d.producto_id = pr.id
         WHERE d.pedido_id = ANY($1::int[])`,
        [purchaseOrderIds]
      );

      for (const d of details) {
        if (!detailsMap.has(d.pedidoId)) {
          detailsMap.set(d.pedidoId, []);
        }
        detailsMap.get(d.pedidoId).push(d);
      }
    }

    const result = orders.map(o => ({
      ...o,
      detalle: o.tipoPedido === "compra" ? (detailsMap.get(o.id) || []) : null
    }));

    res.json(result.map(order => localizeOrder(order, getRequestLanguage(req))));
  } catch (error) {
    console.error("Error al obtener historial del cliente:", error);
    res.status(500).json({ message: "No se pudo obtener el historial de pedidos." });
  }
});

// =========================================================
// GET /api/orders
// Privado (Dueño): Obtener lista completa de pedidos (cotizaciones y compras)
// Extensión aditiva sin romper contrato existente
// =========================================================
router.get("/", requireAuth("dueno"), async (req, res) => {
  try {
    const { rows: orders } = await pool.query(
      `SELECT
         p.id,
         p.usuario_id AS "usuarioId",
         u.nombre AS "nombreComprador",
         p.tipo_pedido AS "tipoPedido",
         p.mueble,
         p.tamano,
         p.dificultad,
         p.estilo,
         p.precio::float AS precio,
         p.horas,
         p.estado,
         p.fecha_creacion AS "fechaCreacion",
         p.fecha_entrega AS "fechaEntrega"
      FROM pedidos p
      JOIN usuarios u ON u.id = p.usuario_id
       ORDER BY p.fecha_creacion DESC
       LIMIT 200`
    );

    const purchaseOrderIds = orders.filter(o => o.tipoPedido === "compra").map(o => o.id);

    let detailsMap = new Map();
    if (purchaseOrderIds.length > 0) {
      const { rows: details } = await pool.query(
        `SELECT
           d.id,
           d.pedido_id AS "pedidoId",
           d.producto_id AS "productoId",
           pr.nombre AS "productoNombre",
           d.cantidad,
           d.precio_unitario::float AS "precioUnitario"
         FROM detalle_pedido d
         JOIN productos pr ON d.producto_id = pr.id
         WHERE d.pedido_id = ANY($1::int[])`,
        [purchaseOrderIds]
      );

      for (const d of details) {
        if (!detailsMap.has(d.pedidoId)) {
          detailsMap.set(d.pedidoId, []);
        }
        detailsMap.get(d.pedidoId).push(d);
      }
    }

    const result = orders.map(o => ({
      ...o,
      detalle: o.tipoPedido === "compra" ? (detailsMap.get(o.id) || []) : null
    }));

    res.json(result.map(order => localizeOrder(order, getRequestLanguage(req))));
  } catch (error) {
    console.error("Error al obtener pedidos del dueño:", error);
    res.status(500).json({ message: "No se pudieron obtener los pedidos." });
  }
});

// =========================================================
// PATCH /api/orders/:id/atendido
// Privado (Dueño): Marcar pedido como atendido
// =========================================================
router.patch("/:id/atendido", requireAuth("dueno"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE pedidos SET estado = 'atendido' WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No se pudo actualizar el pedido." });
  }
});

export default router;
