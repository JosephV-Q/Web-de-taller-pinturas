// Única capa que habla con la API de Anthropic. La API key vive solo en el
// backend (variable de entorno ANTHROPIC_API_KEY) y nunca llega al navegador.

const AI_MODEL = "claude-sonnet-4-6";

async function callClaude(body) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detalle = await response.text().catch(() => "");
    throw new Error(`La API de Anthropic respondió con un error (${response.status}). ${detalle}`);
  }

  const data = await response.json();
  return data.content.map(block => block.text || "").join("").trim();
}

export async function analyzeFurnitureImage(imageBase64, mediaType) {
  const prompt = `Eres un tasador experto de muebles de madera para un taller de pintura y restauración.
Observa la imagen del mueble y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional,
sin explicaciones y sin bloques de código, con exactamente estas claves:
{"tipo_mueble": "nombre breve del mueble, ej. silla, mesa de comedor, armario",
 "tamano": "pequeño" | "mediano" | "grande",
 "dificultad": entero de 1 a 5 (1 = superficie lisa y simple, 5 = muchos detalles, tallados, curvas o piezas desmontables),
 "justificacion": "explicación de máximo 20 palabras de por qué asignaste esa dificultad"}`;

  const text = await callClaude({
    model: AI_MODEL,
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: prompt }
      ]
    }]
  });

  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("No se pudo interpretar la evaluación del mueble.");
  }
}

export async function generateReportText(comentarios) {
  const listado = comentarios
    .map((c, i) => `${i + 1}. (${c.estrellas}★) ${c.comentario}`)
    .join("\n");

  const prompt = `Eres un consultor de experiencia de cliente para un taller de pintura de muebles que atiende por una página web con cotización automática.
Aquí tienes comentarios y calificaciones reales de clientes sobre la página:
${listado}

Escribe un informe breve en español con dos secciones, usando exactamente estos títulos:
FALENCIAS DETECTADAS:
(lista con guiones de los problemas que se repiten en los comentarios)

MEDIDAS SUGERIDAS:
(lista con guiones de acciones concretas para corregir cada falencia)

Sé concreto y basado solo en lo que dicen los comentarios. No inventes problemas que no se mencionan.`;

  return callClaude({
    model: AI_MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  });
}

export async function chatReply(history) {
  return callClaude({
    model: AI_MODEL,
    max_tokens: 500,
    system: `Eres el asistente virtual de un taller de pintura y restauración de muebles de madera.
Ayudas a los clientes a entender el proceso: eligen estilo (natural o rallado imitando veta de madera),
suben una foto del mueble para que se evalúe la dificultad, y reciben precio, horas de trabajo y fecha
de entrega automáticamente. No inventes precios exactos: el precio depende del tamaño, la dificultad y
el estilo, y se calcula solo en el formulario de cotización. Responde en español, breve, cálido y profesional.`,
    messages: history
  });
}
