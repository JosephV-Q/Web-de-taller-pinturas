// Reglas de negocio del taller. Es la MISMA lógica que antes vivía en el
// navegador (js/config/business.js + js/client/quote.js), movida aquí para
// que el precio no pueda ser manipulado desde el cliente.

const PRECIOS_BASE_COP = { "pequeño": 80000, "mediano": 150000, "grande": 280000 };
const HORAS_BASE = { "pequeño": 4, "mediano": 8, "grande": 14 };
const MULTIPLICADOR_ESTILO = { natural: 1.0, rallado: 1.4 };
const HORAS_EXTRA_RALLADO_FACTOR = 1.25;

export const CAPACIDAD_HORAS_POR_DIA = 6;

export function computeQuote(analysis, estilo) {
  const { tamano, dificultad } = analysis;
  const dificultadFactor = 1 + (dificultad - 1) * 0.15;
  const estiloFactorPrecio = MULTIPLICADOR_ESTILO[estilo];

  let precio = PRECIOS_BASE_COP[tamano] * dificultadFactor * estiloFactorPrecio;
  precio = Math.round(precio / 1000) * 1000;

  let horas = HORAS_BASE[tamano] * (1 + (dificultad - 1) * 0.10);
  if (estilo === "rallado") horas *= HORAS_EXTRA_RALLADO_FACTOR;
  horas = Math.round(horas * 2) / 2;

  return { precio, horas };
}

export function addBusinessDays(fromDate, totalHoras, capacidadPorDia) {
  const dias = Math.ceil(totalHoras / capacidadPorDia);
  const date = new Date(fromDate);
  let added = 0;
  while (added < dias) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date;
}
