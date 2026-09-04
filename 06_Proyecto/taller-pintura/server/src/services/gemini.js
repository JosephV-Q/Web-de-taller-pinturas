// Única capa que habla con la API de Gemini. La API key vive solo en el
// backend (variable de entorno GEMINI_API_KEY) y nunca llega al navegador.

const AI_MODEL = "gemini-3.6-flash";

async function callGemini(contents, systemInstruction = null, responseMimeType = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No se ha configurado la variable de entorno GEMINI_API_KEY.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents,
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (responseMimeType) {
    body.generationConfig = {
      responseMimeType
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detalle = await response.text().catch(() => "");
    throw new Error(`La API de Gemini respondió con un error (${response.status}). ${detalle}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("La API de Gemini no devolvió texto en su respuesta.");
  }
  return text.trim();
}

export async function analyzeFurnitureImage(imageBase64, mediaType) {
  const prompt = `Eres un tasador experto de muebles de madera para un taller de pintura y restauración.
Observa la imagen del mueble y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional,
sin explicaciones y sin bloques de código, con exactamente estas claves:
{"tipo_mueble": "nombre breve del mueble, ej. silla, mesa de comedor, armario",
 "tamano": "pequeño" | "mediano" | "grande",
 "dificultad": entero de 1 a 5 (1 = superficie lisa y simple, 5 = muchos detalles, tallados, curvas o piezas desmontables),
 "justificacion": "explicación de máximo 20 palabras de por qué asignaste esa dificultad"}`;

  const contents = [
    {
      parts: [
        {
          inlineData: {
            mimeType: mediaType,
            data: imageBase64
          }
        },
        {
          text: prompt
        }
      ]
    }
  ];

  const text = await callGemini(contents, null, "application/json");

  try {
    return JSON.parse(text);
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

  const contents = [
    {
      parts: [{ text: prompt }]
    }
  ];

  return callGemini(contents);
}

export async function chatReply(history, language = "es") {
  // Mapeamos el historial de formato Anthropic a Gemini
  const contents = history.map(msg => {
    const role = msg.role === "assistant" ? "model" : "user";
    let text = "";
    if (typeof msg.content === "string") {
      text = msg.content;
    } else if (Array.isArray(msg.content)) {
      text = msg.content.map(p => p.text || "").join("");
    }
    return {
      role,
      parts: [{ text }]
    };
  });

  const responseLanguage = language === "en" ? "inglés" : "español";
  const systemInstruction = `Eres el asistente virtual de un taller de pintura y restauración de muebles de madera.
Ayudas a los clientes a entender el proceso: eligen estilo (natural o rallado imitando veta de madera),
suben una foto del mueble para que se evalúe la dificultad, y reciben precio, horas de trabajo y fecha
de entrega automáticamente. No inventes precios exactos: el precio depende del tamaño, la dificultad y
el estilo, y se calcula solo en el formulario de cotización. Responde en español, breve, cálido y profesional.`;
  const localizedInstruction = systemInstruction.replace("español, breve", `${responseLanguage}, breve`);

  return callGemini(contents, localizedInstruction);
}
