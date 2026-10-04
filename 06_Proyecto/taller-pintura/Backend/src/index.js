import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import quotesRoutes from "./routes/quotes.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import ratingsRoutes from "./routes/ratings.routes.js";
import reportRoutes from "./routes/report.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import productsRoutes from "./routes/products.routes.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json({ limit: "8mb" })); // las fotos de los muebles viajan en base64

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/products", productsRoutes);

// Manejador global de errores: evita que excepciones no capturadas cierren el servidor
app.use((err, req, res, _next) => {
  console.error("Error no capturado:", err);
  res.status(500).json({ message: "Error interno del servidor." });
});

app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada." }));

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend del taller escuchando en http://localhost:${PORT}`);
  });
}

export default app;
