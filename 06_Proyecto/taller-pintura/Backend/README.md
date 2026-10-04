# Backend + Neon — guía de integración

Este documento explica cómo conectar Neon y levantar la API. El frontend
vive en `Frontend/` y consume esta API mediante `/api`.

## 0. Qué se agregó

```
taller-pintura/
├── Frontend/              ← Vite, HTML, CSS y JavaScript
└── Backend/               ← Express, PostgreSQL, migraciones y semillas
  ├── schema.sql
  └── src/
    ├── routes/         ← auth, quotes, orders, ratings, report, chat, stats, products
    ├── services/       ← Gemini, precios y localización
    └── middleware/     ← autenticación JWT
```

## 1. Tomar los datos de conexión de Neon

1. Entra a tu proyecto en [Neon Console](https://console.neon.tech).
2. En el panel del proyecto, botón **Connect** (o "Connection Details").
3. Copia el **Connection string** completo. Se ve así:
   ```
   postgresql://usuario:password@ep-xxxxx-pooler.region.aws.neon.tech/nombre_basedatos?sslmode=require
   ```
   Usa el que dice **pooled connection** si tu plan lo ofrece — está pensado
   para servidores tradicionales como este (no solo para funciones serverless).

## 2. Crear las tablas

Tienes dos formas de correr `Backend/schema.sql`:

**Opción A — SQL Editor de Neon (más simple):**
Abre el "SQL Editor" en Neon Console, pega el contenido de `Backend/schema.sql`
y ejecútalo.

**Opción B — desde tu terminal (necesitas `psql` instalado):**
```bash
psql "postgresql://usuario:password@...neon.tech/basedatos?sslmode=require" -f Backend/schema.sql
```

Esto crea 4 tablas: `usuarios`, `pedidos`, `calificaciones`, `informes`.

## 3. Configurar las variables de entorno del backend

```bash
cd Backend
cp .env.example .env
```

Edita `Backend/.env`:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | El connection string del paso 1 |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → API Keys |
| `JWT_SECRET` | Genera una cadena aleatoria: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` en desarrollo |
| `PORT` | `3000` (o el que prefieras) |

**Nunca subas `Backend/.env` a git** — está ignorado por Git.

## 4. Levantar el backend

```bash
cd Backend
npm install
npm run dev
```

Verifica que responde:
```bash
curl http://localhost:3000/api/health
# {"ok":true}
```

Si `DATABASE_URL` está mal escrito o Neon rechaza la conexión, el error
aparece apenas arranca el servidor — revísalo ahí antes de seguir.

## 5. Levantar el frontend

En otra terminal, desde la raíz del proyecto:

```bash
cd Frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El proxy de `vite.config.js` reenvía todo lo
que el frontend pida a `/api` hacia `http://localhost:3000`, así que no
necesitas configurar nada más para desarrollo local.

## 6. Probar el flujo completo

1. **Crear cuenta** (`Crear cuenta` en la pantalla inicial) → revisa que
   aparezca una fila nueva en la tabla `usuarios` de Neon (por defecto con `rol = 'cliente'`).
2. **Cotizar un mueble** como cliente → revisa la tabla `pedidos`.
3. **Calificar la atención** al final de la cotización → tabla `calificaciones`.
4. **Entrar como dueño**: inicia sesión con un usuario que tenga `rol = 'dueno'` en la tabla `usuarios` → deberías ver
   el pedido en "Pedidos pendientes", poder marcarlo como atendido, y ver la
   calificación en la lista.
5. **Generar informe** (necesitas al menos un comentario con texto) → debería
   guardar una fila en `informes` y mostrarla.

## 7. Desplegar a producción

- **Backend**: cualquier hosting de Node (Render, Railway, Fly.io, etc.).
  Configura ahí las mismas variables de `Backend/.env`.
- **Frontend**: `npm run build` genera `dist/`, que puedes subir a un
  hosting estático (Vercel, Netlify, Cloudflare Pages...).
- Como frontend y backend quedarán en dominios distintos:
  - En el hosting del backend, pon `FRONTEND_ORIGIN` con la URL pública del
    frontend (para que CORS lo permita).
  - En el hosting del frontend, define la variable de entorno
    `VITE_API_BASE_URL` con la URL pública del backend + `/api`
    (ej. `https://tu-backend.onrender.com/api`) y vuelve a correr el build.

## Notas de seguridad para la siguiente iteración

- La autenticación se encuentra unificada: tanto clientes como dueño usan el mismo endpoint de login y se diferencian por el rol en base de datos (`cliente` / `dueno`), protegido por JWT con `requireAuth("dueno")`.
- Los tokens (JWT) se guardan en `localStorage` en el navegador. Funciona
  bien para este prototipo; si más adelante quieres protegerte de ataques
  XSS con más rigor, se puede migrar a cookies `httpOnly`.
