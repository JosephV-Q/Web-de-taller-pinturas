# Taller de pintura

Aplicación web con frontend Vite y backend Node.js/Express conectado a PostgreSQL.

## Estructura

- `Frontend/`: interfaz HTML, CSS y JavaScript, configuración Vite y build estático.
- `Backend/`: API Express, acceso a Neon/PostgreSQL, esquema, migraciones y semillas.

## Desarrollo local

Usa dos terminales desde la raíz del repositorio.

Terminal 1, API:

```powershell
cd Backend
npm install
npm run dev
```

Terminal 2, interfaz:

```powershell
cd Frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Vite reenvía `/api` a `http://localhost:3000`.
Configura las variables del backend en `Backend/.env`; el frontend usa
`Frontend/.env` solo cuando la API está en otro dominio.

Consulta [Backend/README.md](Backend/README.md) para Neon, variables de entorno,
pruebas y despliegue.
