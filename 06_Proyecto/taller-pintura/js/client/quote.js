// NOTA: este archivo ya NO se usa en tiempo de ejecución.
//
// El cálculo de precio, horas y fecha de entrega se movió al backend
// (server/src/services/pricing.js), porque calcularlo en el navegador
// permitía que alguien manipulara el precio antes de enviarlo al servidor.
// Se deja este archivo solo como referencia de la fórmula original.

export function computeQuote(analysis, style) {
  throw new Error("computeQuote ahora vive en server/src/services/pricing.js");
}
