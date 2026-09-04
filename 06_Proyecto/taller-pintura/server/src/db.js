import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en las variables de entorno (server/.env)");
}

// Neon exige SSL. rejectUnauthorized:false evita problemas con la cadena de
// certificados en algunos entornos de desarrollo; en la mayoría de hostings
// de producción también funciona sin cambios.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
