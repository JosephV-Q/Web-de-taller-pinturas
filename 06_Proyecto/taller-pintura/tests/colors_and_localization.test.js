import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_COLORS } from "../Backend/src/services/colors.js";
import { localizeOrder } from "../Backend/src/services/localization.js";

test("Catálogo de colores: contiene la paleta estándar coherente con el diseño", () => {
  assert.ok(Array.isArray(DEFAULT_COLORS));
  assert.equal(DEFAULT_COLORS.length, 6);

  const names = DEFAULT_COLORS.map(c => c.nombre);
  assert.ok(names.includes("Blanco Lino"));
  assert.ok(names.includes("Verde Salvia"));
  assert.ok(names.includes("Terracota"));
  assert.ok(names.includes("Nogal Clásico"));
  assert.ok(names.includes("Roble Natural"));
  assert.ok(names.includes("Gris Carbón"));

  for (const c of DEFAULT_COLORS) {
    assert.match(c.hex, /^#[0-9A-Fa-f]{6}$/);
    assert.ok(c.descripcion && c.descripcion.length > 5);
  }
});

test("Localización: traduce estilo 'solo_color' y colores seleccionados a inglés", () => {
  const orderEs = {
    mueble: "mesa",
    tamano: "mediano",
    estilo: "solo_color",
    color: "Verde Salvia",
    detalle: [
      { productoNombre: "Kit de Pintura Chalk Paint DIY", color: "Blanco Lino" }
    ]
  };

  const localizedEn = localizeOrder(orderEs, "en");
  assert.equal(localizedEn.mueble, "table");
  assert.equal(localizedEn.tamano, "medium");
  assert.equal(localizedEn.estilo, "solid color");
  assert.equal(localizedEn.color, "sage green");
  assert.equal(localizedEn.detalle[0].color, "linen white");

  const localizedEs = localizeOrder(orderEs, "es");
  assert.equal(localizedEs.estilo, "solo_color");
  assert.equal(localizedEs.color, "Verde Salvia");
});
