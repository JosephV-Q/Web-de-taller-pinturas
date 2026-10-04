-- =========================================================
-- ESQUEMA DE BASE DE DATOS COMPLETO (Instalación Nueva)
-- Taller de Pintura y Restauración de Muebles + E-commerce
-- =========================================================
-- Ejecutar este archivo UNA VEZ contra una base de datos nueva de Neon.
-- Opción A: Pegarlo en el "SQL Editor" del panel de Neon Console y ejecutarlo.
-- Opción B: psql "$DATABASE_URL" -f server/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------
-- TIPOS ENUM
-- ---------------------------------------------------------
CREATE TYPE rol_usuario     AS ENUM ('cliente', 'dueno');
CREATE TYPE tamano_mueble   AS ENUM ('pequeno', 'mediano', 'grande');
CREATE TYPE estilo_pintura  AS ENUM ('natural', 'rallado');
CREATE TYPE estado_pedido   AS ENUM ('pendiente', 'atendido');
CREATE TYPE estado_producto AS ENUM ('activo', 'inactivo');
CREATE TYPE tipo_pedido     AS ENUM ('cotizacion', 'compra');

-- ---------------------------------------------------------
-- USUARIOS
-- ---------------------------------------------------------
CREATE TABLE usuarios (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          VARCHAR(150)  NOT NULL,
  email           VARCHAR(150)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  rol             rol_usuario   NOT NULL DEFAULT 'cliente',
  fecha_registro  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_email UNIQUE (email)
);

-- ---------------------------------------------------------
-- CATEGORIAS (Productos e Insumos)
-- ---------------------------------------------------------
CREATE TABLE categorias (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre          VARCHAR(100)  NOT NULL,
  descripcion     TEXT          NULL,
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
);

-- ---------------------------------------------------------
-- PRODUCTOS (Inventario Físico y Servicios de Precio Fijo)
-- ---------------------------------------------------------
CREATE TABLE productos (
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

CREATE INDEX idx_productos_categoria ON productos (categoria_id);
CREATE INDEX idx_productos_estado    ON productos (estado);

-- ---------------------------------------------------------
-- PEDIDOS (Cotizaciones de Restauración y Compras de Catálogo)
-- (imagen_id se agrega con FK más abajo por relación circular con IMAGENES)
-- ---------------------------------------------------------
CREATE TABLE pedidos (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id      INTEGER         NOT NULL,
  tipo_pedido     tipo_pedido     NOT NULL DEFAULT 'cotizacion',
  imagen_id       INTEGER         NULL,
  mueble          VARCHAR(100)    NULL,
  tamano          tamano_mueble   NULL,
  dificultad      SMALLINT        NULL,
  estilo          estilo_pintura  NULL,
  precio          NUMERIC(10,2)   NOT NULL,
  horas           NUMERIC(5,1)    NULL,
  fecha_creacion  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_entrega   TIMESTAMP       NULL,
  estado          estado_pedido   NOT NULL DEFAULT 'pendiente',
  CONSTRAINT fk_pedidos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_pedidos_dificultad
    CHECK (dificultad IS NULL OR (dificultad BETWEEN 1 AND 5)),
  CONSTRAINT chk_pedidos_precio
    CHECK (precio >= 0),
  CONSTRAINT chk_pedidos_horas
    CHECK (horas IS NULL OR horas >= 0)
);

CREATE INDEX idx_pedidos_usuario ON pedidos (usuario_id);
CREATE INDEX idx_pedidos_estado  ON pedidos (estado);
CREATE INDEX idx_pedidos_tipo    ON pedidos (tipo_pedido);

-- ---------------------------------------------------------
-- DETALLE_PEDIDO (Ítems de Pedidos tipo 'compra')
-- ---------------------------------------------------------
CREATE TABLE detalle_pedido (
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

CREATE INDEX idx_detalle_pedido_pedido   ON detalle_pedido (pedido_id);
CREATE INDEX idx_detalle_pedido_producto ON detalle_pedido (producto_id);

-- ---------------------------------------------------------
-- IMAGENES
-- ---------------------------------------------------------
CREATE TABLE imagenes (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id      INTEGER       NOT NULL,
  pedido_id       INTEGER       NULL,
  nombre_archivo  VARCHAR(255)  NOT NULL,
  ruta            VARCHAR(500)  NOT NULL,
  tipo            VARCHAR(50)   NOT NULL,
  fecha_subida    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_imagenes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_imagenes_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_imagenes_usuario ON imagenes (usuario_id);
CREATE INDEX idx_imagenes_pedido  ON imagenes (pedido_id);

-- FK de pedidos.imagen_id -> imagenes.id
ALTER TABLE pedidos
  ADD CONSTRAINT fk_pedidos_imagen
    FOREIGN KEY (imagen_id) REFERENCES imagenes(id)
    ON DELETE SET NULL;

CREATE INDEX idx_pedidos_imagen ON pedidos (imagen_id);

-- ---------------------------------------------------------
-- CALIFICACIONES
-- ---------------------------------------------------------
CREATE TABLE calificaciones (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id      INTEGER   NOT NULL,
  pedido_id       INTEGER   NOT NULL,
  estrellas       SMALLINT  NOT NULL,
  comentario      TEXT      NULL,
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_calificaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_calificaciones_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_calificaciones_estrellas CHECK (estrellas BETWEEN 1 AND 5)
);

CREATE INDEX idx_calificaciones_usuario ON calificaciones (usuario_id);
CREATE INDEX idx_calificaciones_pedido  ON calificaciones (pedido_id);

-- ---------------------------------------------------------
-- INFORMES (generados por IA a partir de calificaciones)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS informes (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  texto        TEXT        NOT NULL,
  generado_en  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);