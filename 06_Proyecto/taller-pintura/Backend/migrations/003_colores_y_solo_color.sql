-- =========================================================
-- MIGRACIÓN: 003_colores_y_solo_color.sql
-- Objetivo: Agregar la opción de cotización 'solo_color', el
--           catálogo aditivo de colores y tonalidades del taller,
--           y la persistencia del color en cotizaciones y pedidos.
-- Base de datos: PostgreSQL / Neon Console
-- =========================================================
-- Esta migración es estrictamente aditiva, segura y no destructiva:
--  - NO realiza DROP ni TRUNCATE.
--  - NO elimina usuarios, pedidos, productos ni calificaciones.
--  - Mantiene intacta toda la funcionalidad y datos existentes.
--  - Los datos iniciales se insertan de forma idempotente (ON CONFLICT).
-- =========================================================

-- 1. Agregar 'solo_color' al tipo ENUM estilo_pintura si aún no existe
ALTER TYPE estilo_pintura ADD VALUE IF NOT EXISTS 'solo_color';

-- 2. Crear tabla de COLORES (Catálogo de tonalidades disponibles en el taller)
CREATE TABLE IF NOT EXISTS colores (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          VARCHAR(100)  NOT NULL,
  hex             VARCHAR(20)   NOT NULL,
  descripcion     TEXT          NULL,
  activo          BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_colores_nombre UNIQUE (nombre)
);

CREATE INDEX IF NOT EXISTS idx_colores_activo ON colores (activo);

-- 3. Cargar datos iniciales del catálogo de colores de forma idempotente
INSERT INTO colores (nombre, hex, descripcion)
VALUES
  ('Blanco Lino',   '#F5F2EB', 'Blanco cálido mate con acabado sedoso.'),
  ('Verde Salvia',  '#4A6B6C', 'Tono verde botánico vintage, insignia del taller.'),
  ('Terracota',     '#D96B43', 'Tono tierra cocida cálido y artesanal.'),
  ('Nogal Clásico', '#5A3D24', 'Tono madera oscura clásica y profunda.'),
  ('Roble Natural', '#C49A6C', 'Marrón dorado cálido con acabado natural.'),
  ('Gris Carbón',   '#2D2A26', 'Gris carbón oscuro moderno y elegante.')
ON CONFLICT (nombre) DO UPDATE
SET hex = EXCLUDED.hex,
    descripcion = EXCLUDED.descripcion;

-- 4. Modificar tabla PEDIDOS de forma aditiva y compatible con datos existentes
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS color VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS color_id INTEGER NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_pedidos_color'
  ) THEN
    ALTER TABLE pedidos
      ADD CONSTRAINT fk_pedidos_color
      FOREIGN KEY (color_id) REFERENCES colores(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pedidos_color ON pedidos (color);

-- 5. Modificar tabla DETALLE_PEDIDO para almacenar la tonalidad en compras de productos que lo requieran
ALTER TABLE detalle_pedido
  ADD COLUMN IF NOT EXISTS color VARCHAR(100) NULL;
