# Taller de pintura y restauración de muebles

Aplicación web para cotizar trabajos de restauración, comprar productos para pintar muebles y administrar pedidos e inventario. El frontend está construido con Vite, HTML, CSS y JavaScript; el backend usa Node.js, Express y PostgreSQL (compatible con Neon).

## Funcionalidades

- Registro e inicio de sesión para clientes y propietarios, con autorización por rol.
- Cotización de restauraciones a partir de una imagen del mueble y cálculo de precio.
- Catálogo de productos, carrito de compras e historial de pedidos.
- Administración de productos, categorías e inventario.
- Calificaciones de clientes e informes para el propietario.
- Asistente de chat integrado.
- Interfaz en español e inglés.

## Estructura del proyecto

```text
taller-pintura/
├── Backend/
│   ├── migrations/          # Cambios incrementales de base de datos
│   ├── seeds/               # Datos iniciales del catálogo
│   ├── src/
│   │   ├── middleware/      # Autenticación y autorización
│   │   ├── routes/          # Endpoints de la API
│   │   ├── services/        # IA, precios y localización
│   │   ├── db.js            # Conexión PostgreSQL
│   │   └── index.js         # Configuración y arranque de Express
│   ├── schema.sql           # Esquema completo para una base nueva
│   └── package.json
├── Frontend/
│   ├── css/                 # Variables, estilos base y componentes
│   ├── js/
│   │   ├── auth/            # Flujos de autenticación
│   │   ├── cart/            # Carrito de compras
│   │   ├── client/          # Tienda, cotizador e historial del cliente
│   │   ├── config/          # Configuración de API y negocio
│   │   ├── navigation/      # Navegación entre vistas
│   │   ├── owner/           # Panel de administración
│   │   ├── services/        # Comunicación con la API y almacenamiento
│   │   ├── state/           # Estado compartido
│   │   └── utils/           # Funciones auxiliares
│   ├── index.html
│   ├── vite.config.js       # Servidor de desarrollo y proxy de API
│   └── package.json
└── README.md
```

## Requisitos

- Node.js y npm.
- Una base de datos PostgreSQL. [Neon](https://neon.tech) es compatible.
- Una clave de Gemini para las funciones que usan IA.

## Configuración inicial

### 1. Preparar la base de datos

Para una instalación nueva, crea una base de datos y ejecuta `Backend/schema.sql` desde el SQL Editor de Neon o con `psql`:

```powershell
psql "$env:DATABASE_URL" -f Backend/schema.sql
```

Para cargar categorías y productos de ejemplo, ejecuta después `Backend/seeds/products.sql`. Si ya tienes una base anterior a la incorporación del inventario, revisa y aplica `Backend/migrations/001_products_inventory.sql` en lugar de volver a crear el esquema completo.

### 2. Configurar el backend

Desde la raíz del repositorio, copia el archivo de ejemplo y completa `Backend/.env`:

```powershell
Copy-Item Backend/.env.example Backend/.env
```

Configura estas variables:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL/Neon. |
| `GEMINI_API_KEY` | Clave para el análisis de imágenes y funciones de IA. |
| `JWT_SECRET` | Secreto aleatorio usado para firmar tokens de sesión. |
| `FRONTEND_ORIGIN` | Origen permitido por CORS; en local, `http://localhost:5173`. |
| `PORT` | Puerto de la API; por defecto, `3000`. |

No publiques `Backend/.env` ni incluyas credenciales en el repositorio.

### 3. Instalar dependencias

```powershell
Push-Location Backend
npm install
Pop-Location

Push-Location Frontend
npm install
Pop-Location
```

## Desarrollo local

Abre dos terminales desde la raíz del repositorio.

Terminal 1, API:

```powershell
cd Backend
npm run dev
```

Terminal 2, frontend:

```powershell
cd Frontend
npm run dev
```

Abre <http://localhost:5173>. Vite reenvía las solicitudes `/api` a `http://localhost:3000`. Puedes comprobar que la API está activa en <http://localhost:3000/api/health>.

## Compilación del frontend

Desde la carpeta `Frontend/`:

```powershell
npm run build
```

Vite genera los archivos de producción en `Frontend/dist/`. Para previsualizar esa compilación, ejecuta `npm run preview` en la misma carpeta.

## Despliegue

- Configura en el backend las variables de `Backend/.env` en el proveedor de hosting.
- Define `FRONTEND_ORIGIN` con el dominio público del frontend.
- Si frontend y backend se publican en dominios diferentes, configura `VITE_API_BASE_URL` con la URL pública de la API y vuelve a compilar. Puedes partir de `Frontend/.env.example`.
- Publica el contenido de `Frontend/dist/` en un hosting estático.

Consulta [Backend/README.md](Backend/README.md) para los detalles de conexión con Neon y despliegue.

## Convenciones de commits

Usa estos prefijos para describir el propósito de cada cambio:

| Prefijo | Cuándo usarlo | Ejemplo |
| --- | --- | --- |
| **`feat`** | Cuando añades una nueva funcionalidad (*feature*). | `feat: agregar sistema de autenticación` |
| **`fix`** | Cuando corriges un error o *bug*. | `fix: resolver error de cálculo en el carrito` |
| **`docs`** | Para cambios exclusivos en la documentación (README, comentarios, wikis). | `docs: actualizar instrucciones de instalación` |
| **`style`** | Cambios de formato que no afectan la lógica del código (espaciado, punto y coma, comillas). | `style: corregir indentación en el controlador` |
| **`refactor`** | Cambios en el código que no añaden funciones ni corrigen errores, pero mejoran la estructura o legibilidad. | `refactor: simplificar la función de validación` |
| **`perf`** | Cambios en el código diseñados específicamente para mejorar el rendimiento. | `perf: reducir tiempo de carga de las imágenes` |
| **`test`** | Para añadir pruebas faltantes o modificar pruebas existentes. | `test: agregar pruebas unitarias para el login` |
| **`build`** | Cambios que afectan el sistema de compilación o dependencias externas (npm, pip, Gradle, etc.). | `build: actualizar versión de TypeScript` |
| **`ci`** | Cambios en los archivos y scripts de integración/despliegue continuo (GitHub Actions, GitLab CI, etc.). | `ci: configurar pipeline para producción` |
| **`chore`** | Tareas de mantenimiento o cambios menores que no modifican el código fuente ni las pruebas. | `chore: actualizar archivo .gitignore` |

---
