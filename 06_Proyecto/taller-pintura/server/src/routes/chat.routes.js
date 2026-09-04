import { Router } from "express";
import { chatReply } from "../services/gemini.js";

const router = Router();

router.post("/", async (req, res) => {
  const { history, language } = req.body || {};

  if (!Array.isArray(history) || !history.length) {
    return res.status(400).json({ message: "Falta el mensaje." });
  }

  try {
    const reply = await chatReply(history, language);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "No pude responder en este momento." });
  }
});

export default router;
