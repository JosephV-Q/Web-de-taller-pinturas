import { apiFetch } from "../config/api.js";

// Genera la cotización completa: el backend analiza la imagen con IA,
// calcula precio/horas con las reglas del negocio y registra el pedido.
export async function requestQuote(imageBase64, mediaType, estilo) {
  const data = await apiFetch("/quotes", {
    method: "POST",
    body: { imageBase64, mediaType, estilo },
    auth: true
  });

  return {
    analysis: data.analysis,
    quote: data.quote,
    queueInfo: {
      pendingHoursBefore: data.queueInfo.pendingHoursBefore,
      deliveryDate: new Date(data.queueInfo.deliveryDate)
    },
    orderId: data.orderId
  };
}

export async function generateImprovementReport() {
  const data = await apiFetch("/report/generate", { method: "POST", auth: true });
  return data.texto;
}

export async function sendChatMessage(history, language = "es") {
  const data = await apiFetch("/chat", { method: "POST", body: { history, language } });
  return data.reply;
}
