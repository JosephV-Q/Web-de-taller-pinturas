import jwt from "jsonwebtoken";

// Middleware de autenticación. Uso: requireAuth() para "cualquier usuario con
// token válido", o requireAuth("dueno") para exigir además ese rol exacto.
export function requireAuth(rolRequerido) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "No autenticado." });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (rolRequerido) {
        const normalizeRole = r => (r === "dueño" ? "dueno" : r);
        if (normalizeRole(payload.rol) !== normalizeRole(rolRequerido)) {
          return res.status(403).json({ message: "No tienes permiso para esta acción." });
        }
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ message: "Sesión inválida o expirada." });
    }
  };
}
