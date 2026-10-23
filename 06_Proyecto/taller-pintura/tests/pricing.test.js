import test from "node:test";
import assert from "node:assert/strict";
import { computeQuote, addBusinessDays } from "../Backend/src/services/pricing.js";

test("Pricing: cotización con estilo 'natural' usa multiplicador 1.0 y horas estándar", () => {
  const analysis = { tamano: "mediano", dificultad: 1 };
  const res = computeQuote(analysis, "natural");

  // Base mediano = 150000 COP, dificultad 1 = factor 1.0, estilo natural = 1.0
  assert.equal(res.precio, 150000);
  // Horas base mediano = 8, dificultad 1 = factor 1.0
  assert.equal(res.horas, 8);
});

test("Pricing: cotización con estilo 'rallado' aplica multiplicador 1.4 y factor de horas 1.25", () => {
  const analysis = { tamano: "mediano", dificultad: 1 };
  const res = computeQuote(analysis, "rallado");

  // Base mediano = 150000 COP, factor rallado 1.4 -> 210000
  assert.equal(res.precio, 210000);
  // Horas base 8 * 1.25 = 10
  assert.equal(res.horas, 10);
});

test("Pricing: cotización con estilo 'solo_color' preserva regla base sin alterar precios por iniciativa propia", () => {
  const analysis = { tamano: "mediano", dificultad: 1 };
  const res = computeQuote(analysis, "solo_color");

  // Preserva comportamiento base: factor 1.0, 150000 COP
  assert.equal(res.precio, 150000);
  // Horas base estándar sin horas extra de veta de madera
  assert.equal(res.horas, 8);
});

test("Pricing: cotización para mueble grande y dificultad alta con 'solo_color'", () => {
  const analysis = { tamano: "grande", dificultad: 3 };
  const res = computeQuote(analysis, "solo_color");

  // Base grande = 280000, dificultad factor = 1 + (3 - 1) * 0.15 = 1.30 -> 364000
  assert.equal(res.precio, 364000);
  // Horas base grande = 14 * (1 + 0.20) = 16.8 -> redondeado a múltiplo de 0.5 = 17
  assert.equal(res.horas, 17);
});

test("Pricing: cálculo de días hábiles de entrega", () => {
  const viernes = new Date("2026-10-23T10:00:00Z"); // Viernes
  // 12 horas con capacidad 6h/día = 2 días hábiles (Viernes -> Lunes)
  const entrega = addBusinessDays(viernes, 12, 6);
  assert.ok(entrega > viernes);
  // No debe caer en fin de semana (0 = domingo, 6 = sábado)
  assert.notEqual(entrega.getDay(), 0);
  assert.notEqual(entrega.getDay(), 6);
});
