-- =========================================================
-- MIGRACIÓN: 001_products_inventory.sql
-- Objetivo: Agregar catálogo de productos, inventario y soporte
--           para pedidos de tipo compra sin alterar datos existentes.
-- Base de datos: PostgreSQL / Neon Console
-- =========================================================
-- Esta migración es segura y no destructiva:
--  - NO realiza DROP TABLE.
--  - NO elimina usuarios, pedidos, cotizaciones ni calificaciones.
--  - Mantiene intacta la funcionalidad existente.
-- =========================================================

-- 1. Crear tipos ENUM requeridos si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_producto') THEN
    CREATE TYPE estado_producto AS ENUM ('activo', 'inactivo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_pedido') THEN
    CREATE TYPE tipo_pedido AS ENUM ('cotizacion', 'compra');
  END IF;
END $$;

-- 2. Crear tabla CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          VARCHAR(100)  NOT NULL,
  descripcion     TEXT          NULL,
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
);

-- 3. Crear tabla PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  categoria_id        INTEGER         NOT NULL,
  nombre              VARCHAR(150)    NOT NULL,
  descripcion         TEXT            NULL,
  precio              NUMERIC(10,2)   NOT NULL,
  imagen_url          VARCHAR(500)    NULL,
  cantidad_disponible INTEGER         NOT NULL DEFAULT 0,
  stock_minimo        INTEGER         NOT NULL DEFAULT 0,
  estado              estado_producto NOT NULL DEFAULT 'activo',
  fecha_creacion      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_productos_nombre
    UNIQUE (nombre),
  CONSTRAINT chk_productos_precio
    CHECK (precio >= 0),
  CONSTRAINT chk_productos_cantidad
    CHECK (cantidad_disponible >= 0),
  CONSTRAINT chk_productos_stock_min
    CHECK (stock_minimo >= 0)
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_estado    ON productos (estado);

-- 4. Modificar tabla PEDIDOS de forma compatible con datos existentes
-- 4.1 Agregar columna tipo_pedido con valor por defecto 'cotizacion' (asigna 'cotizacion' a todos los pedidos previos)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tipo_pedido tipo_pedido NOT NULL DEFAULT 'cotizacion';

-- 4.2 Hacer nullable las columnas exclusivas de cotización dinámica
ALTER TABLE pedidos ALTER COLUMN mueble DROP NOT NULL;
ALTER TABLE pedidos ALTER COLUMN tamano DROP NOT NULL;
ALTER TABLE pedidos ALTER COLUMN dificultad DROP NOT NULL;
ALTER TABLE pedidos ALTER COLUMN estilo DROP NOT NULL;
ALTER TABLE pedidos ALTER COLUMN horas DROP NOT NULL;

-- 4.3 Actualizar / asegurar constraints en pedidos
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS chk_pedidos_dificultad;
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_dificultad
  CHECK (dificultad IS NULL OR (dificultad BETWEEN 1 AND 5));

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS chk_pedidos_precio;
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_precio
  CHECK (precio >= 0);

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS chk_pedidos_horas;
ALTER TABLE pedidos ADD CONSTRAINT chk_pedidos_horas
  CHECK (horas IS NULL OR horas >= 0);

-- 4.4 Índice para búsquedas y filtros por tipo de pedido
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo ON pedidos (tipo_pedido);

-- 5. Crear tabla DETALLE_PEDIDO para compras de catálogo
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id       INTEGER         NOT NULL,
  producto_id     INTEGER         NOT NULL,
  cantidad        INTEGER         NOT NULL,
  precio_unitario NUMERIC(10,2)   NOT NULL,
  CONSTRAINT fk_detalle_pedido_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_detalle_pedido_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_cantidad
    CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_precio_unitario
    CHECK (precio_unitario >= 0)
);

CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido   ON detalle_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_producto ON detalle_pedido (producto_id);