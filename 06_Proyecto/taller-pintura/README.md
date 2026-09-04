# Taller de pintura de muebles — estructura separada

Este proyecto parte del prototipo original y conserva su flujo funcional, separando responsabilidades en HTML, CSS y JavaScript.

## Estructura

- `index.html`: estructura de las vistas.
- `css/`: estilos separados por responsabilidad.
- `js/config/`: configuración del negocio.
- `js/state/`: estado de la aplicación.
- `js/navigation/`: navegación entre roles.
- `js/client/`: flujo de cotización, imagen, resultado y calificación.
- `js/owner/`: dashboard e informes del dueño.
- `js/services/`: autenticación, almacenamiento, pedidos y comunicación con IA.
- `js/utils/`: utilidades.

## Importante

La aplicación cuenta con backend seguro en Node.js/Express conectado a PostgreSQL (Neon), autenticación JWT/bcrypt unificada por roles (`cliente` / `dueno`), y análisis con IA en el servidor.

## Ejecución

El proyecto usa módulos ES (`type="module"`). Debe servirse desde un servidor HTTP local/hosting, no abrirse directamente como `file://`.

Ejemplo:

```bash
python -m http.server 8000
```

Luego abrir:

`http://localhost:8000/`
