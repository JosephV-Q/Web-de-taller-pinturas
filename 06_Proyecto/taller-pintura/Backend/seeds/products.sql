-- =========================================================
-- SEEDS: products.sql
-- Datos iniciales para el catálogo de productos e inventario
-- =========================================================

-- 1. Insertar Categorías
INSERT INTO categorias (nombre, descripcion)
VALUES
  (
    'Kits y Pinturas DIY',
    'Kits completos de pintura chalk paint, ceras y selladores para proyectos de renovación y personalización de muebles en casa.'
  ),
  (
    'Herramientas y Acabados',
    'Brochas profesionales, barnices de alta durabilidad y servicios de mantenimiento exprés de precio fijo.'
  )
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion;

-- 2. Insertar Productos de Ejemplo
INSERT INTO productos (
  categoria_id,
  nombre,
  descripcion,
  precio,
  imagen_url,
  cantidad_disponible,
  stock_minimo,
  estado
)
VALUES
  (
    (SELECT id FROM categorias WHERE nombre = 'Kits y Pinturas DIY'),
    'Kit de Pintura Chalk Paint DIY',
    'Set completo para restaurar un mueble mediano. Incluye 2 pinturas a la tiza de 500ml (color a elección), lija grano fino, brocha de cerda natural y cera incolora de protección.',
    85.00,
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    25,
    5,
    'activo'
  ),
  (
    (SELECT id FROM categorias WHERE nombre = 'Kits y Pinturas DIY'),
    'Barniz Protector Poliuretánico Mate 500ml',
    'Sellador protector al agua con acabado mate sedoso. Proporciona máxima resistencia contra rayones, manchas y humedad para madera y muebles pintados.',
    42.50,
    'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    40,
    10,
    'activo'
  ),
  (
    (SELECT id FROM categorias WHERE nombre = 'Herramientas y Acabados'),
    'Set de Brochas y Pinceles de Precisión (5 piezas)',
    'Juego de brochas profesionales con cerdas sintéticas ultrafinas. Diseñadas para aplicar pinturas y barnices sin dejar marcas ni rayas de pincelada.',
    35.00,
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
    30,
    8,
    'activo'
  ),
  (
    (SELECT id FROM categorias WHERE nombre = 'Herramientas y Acabados'),
    'Servicio de Restauración y Encerado Exprés',
    'Servicio en taller de precio fijo: limpieza técnica profunda, nutrición de fibras de madera, reavivado de tono y encerado artesanal para sillas o mesas de luz.',
    60.00,
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
    15,
    2,
    'activo'
  )
ON CONFLICT (nombre) DO UPDATE
SET
  categoria_id        = EXCLUDED.categoria_id,
  descripcion         = EXCLUDED.descripcion,
  precio              = EXCLUDED.precio,
  imagen_url          = EXCLUDED.imagen_url,
  cantidad_disponible = EXCLUDED.cantidad_disponible,
  stock_minimo        = EXCLUDED.stock_minimo,
  estado              = EXCLUDED.estado;
