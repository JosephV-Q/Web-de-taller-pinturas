import test from "node:test";
import assert from "node:assert/strict";

// Función de validación de cotización que replica las reglas del backend (quotes.routes.js)
function validateQuotePayload(payload) {
  const { imageBase64, mediaType, estilo, color } = payload || {};

  if (!imageBase64 || !mediaType) {
    return { valid: false, status: 400, message: "Falta la imagen del mueble." };
  }

  const validStyles = ["natural", "rallado", "solo_color"];
  if (!validStyles.includes(estilo)) {
    return { valid: false, status: 400, message: "Estilo inválido." };
  }

  // Validación condicional del color:
  // Requerido obligatoriamente solo cuando se elija 'rallado' o 'solo_color'
  if (["rallado", "solo_color"].includes(estilo)) {
    if (!color || typeof color !== "string" || !color.trim()) {
      return { valid: false, status: 400, message: "Debes seleccionar un color o tonalidad para este estilo." };
    }
  }

  const sanitizedColor = ["rallado", "solo_color"].includes(estilo) ? color.trim().slice(0, 100) : null;

  return {
    valid: true,
    estilo,
    color: sanitizedColor
  };
}

test("Validación de cotización: estilo 'natural' es válido sin color", () => {
  const res = validateQuotePayload({
    imageBase64: "base64data",
    mediaType: "image/jpeg",
    estilo: "natural"
  });

  assert.equal(res.valid, true);
  assert.equal(res.estilo, "natural");
  assert.equal(res.color, null);
});

test("Validación de cotización: estilo 'solo_color' requiere color obligatoriamente", () => {
  const missingColor = validateQuotePayload({
    imageBase64: "base64data",
    mediaType: "image/jpeg",
    estilo: "solo_color"
  });
  assert.equal(missingColor.valid, false);
  assert.match(missingColor.message, /Debes seleccionar un color/i);

  const emptyColor = validateQuotePayload({
    imageBase64: "base64data",
    mediaType: "image/jpeg",
    estilo: "solo_color",
    color: "   "
  });
  assert.equal(emptyColor.valid, false);

  const withColor = validateQuotePayload({
    imageBase64: "base64data",
    mediaType: "image/jpeg",
    estilo: "solo_color",
    color: "Verde Salvia"
  });
  assert.equal(withColor.valid, true);
  assert.equal(withColor.color, "Verde Salvia");
});

test("Validación de cotización: estilo 'rallado' requiere color obligatoriamente", () => {
  const missingColor = validateQuotePayload({
    imageBase64: "base64data",
    mediaType: "image/jpeg",
    estilo: "rallado"
  });
  assert.equal(missingColor.valid, false);

  const withColor = validateQuotePayload({
    imageBase64: "base64data",
    mediaType: "image/jpeg",
    estilo: "rallado",
    color: "Nogal Clásico"
  });
  assert.equal(withColor.valid, true);
  assert.equal(withColor.color, "Nogal Clásico");
});

test("Validación de cotización: rechaza estilos desconocidos o inválidos", () => {
  const invalid = validateQuotePayload({
    imageBase64: "base64data",
    mediaType: "image/jpeg",
    estilo: "estilo_inexistente"
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.message, "Estilo inválido.");
});
