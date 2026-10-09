BEGIN;

-- Columnas de control en pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS atendido_en            TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS notificado_dueno_at    TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS notificado_cliente_at  TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS notificado_atendido_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS calificacion_token     UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS uq_pedidos_calificacion_token
  ON pedidos (calificacion_token);

-- Control de alertas de stock
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS alerta_stock_enviada_at TIMESTAMP NULL;

-- Control de calificaciones procesadas + una calificación por pedido
ALTER TABLE calificaciones
  ADD COLUMN IF NOT EXISTS procesada_at TIMESTAMP NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_calificaciones_pedido
  ON calificaciones (pedido_id);

-- Tarea de seguimiento para calificaciones bajas
CREATE TABLE IF NOT EXISTS seguimientos (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  calificacion_id INTEGER NOT NULL UNIQUE REFERENCES calificaciones(id) ON DELETE CASCADE,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado          VARCHAR(20) NOT NULL DEFAULT 'abierto'
                  CHECK (estado IN ('abierto','en_proceso','cerrado')),
  nota            TEXT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cerrado_en      TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS idx_seguimientos_estado ON seguimientos (estado);

-- Funciones auxiliares de formato (las usan todas las consultas de Make)
CREATE OR REPLACE FUNCTION esc_html(t TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT replace(replace(replace(replace(coalesce(t,''),'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;')
$$;

-- 150000 -> $150.000 ; 85.5 -> $85,50
CREATE OR REPLACE FUNCTION fmt_cop(n NUMERIC) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN n IS NULL THEN ''
    WHEN n = trunc(n) THEN '$' || replace(to_char(n,'FM999,999,999,990'),',','.')
    ELSE '$' || replace(replace(replace(to_char(n,'FM999,999,999,990.00'),',','#'),'.',','),'#','.')
  END
$$;

-- Convierte un TIMESTAMP guardado en UTC a hora de Bogotá y lo formatea
CREATE OR REPLACE FUNCTION fmt_ts(ts TIMESTAMP, f TEXT DEFAULT 'DD/MM/YYYY') RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN ts IS NULL THEN ''
    ELSE to_char((ts AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota', f) END
$$;

-- Guarda automáticamente cuándo se atendió un pedido (sirve aunque lo cambies a mano en Neon)
CREATE OR REPLACE FUNCTION trg_pedidos_atendido() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = 'atendido' AND OLD.estado IS DISTINCT FROM 'atendido' THEN
    NEW.atendido_en := COALESCE(NEW.atendido_en, now());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS pedidos_atendido_bu ON pedidos;
CREATE TRIGGER pedidos_atendido_bu
  BEFORE UPDATE OF estado ON pedidos
  FOR EACH ROW EXECUTE FUNCTION trg_pedidos_atendido();

COMMIT;

