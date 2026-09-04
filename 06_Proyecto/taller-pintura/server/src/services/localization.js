const productTranslations = {
  "Kits y Pinturas DIY": "DIY Kits and Paints",
  "Herramientas y Acabados": "Tools and Finishes",
  "Kit de Pintura Chalk Paint DIY": "DIY Chalk Paint Kit",
  "Set completo para restaurar un mueble mediano. Incluye 2 pinturas a la tiza de 500ml (color a elección), lija grano fino, brocha de cerda natural y cera incolora de protección.": "Complete set for restoring a medium-sized piece of furniture. Includes two 500ml chalk paints (color of your choice), fine-grit sandpaper, a natural-bristle brush, and colorless protective wax.",
  "Barniz Protector Poliuretánico Mate 500ml": "Matte Polyurethane Protective Varnish 500ml",
  "Set de Brochas y Pinceles de Precisión (5 piezas)": "Precision Brushes and Detail Brushes Set (5 pieces)",
  "Servicio de Restauración y Encerado Exprés": "Express Restoration and Waxing Service",
  "Sellador protector al agua con acabado mate sedoso. Proporciona máxima resistencia contra rayones, manchas y humedad para madera y muebles pintados.": "Water-based protective sealer with a silky matte finish. Provides maximum resistance against scratches, stains, and moisture for wood and painted furniture.",
  "Juego de brochas profesionales con cerdas sintéticas ultrafinas. Diseñadas para aplicar pinturas y barnices sin dejar marcas ni rayas de pincelada.": "Set of professional brushes with ultra-fine synthetic bristles. Designed to apply paints and varnishes without leaving marks or brush streaks.",
  "Servicio en taller de precio fijo: limpieza técnica profunda, nutrición de fibras de madera, reavivado de tono y encerado artesanal para sillas o mesas de luz.": "Fixed-price workshop service: deep technical cleaning, wood-fiber nourishment, tone revival, and handcrafted waxing for chairs or nightstands."
};

const phraseTranslations = {
  pequeño: "small",
  mediano: "medium",
  grande: "large",
  natural: "natural",
  rallado: "wood grain",
  mueble: "furniture",
  silla: "chair",
  mesa: "table",
  armario: "cabinet",
  "mesa de noche": "nightstand"
};

function translateValue(value, language) {
  if (language !== "en" || typeof value !== "string") return value;
  return productTranslations[value] || phraseTranslations[value.toLowerCase()] || value;
}

export function getRequestLanguage(req) {
  const language = req.headers["accept-language"] || "es";
  return language.toLowerCase().startsWith("en") ? "en" : "es";
}

export function localizeProduct(product, language) {
  if (language !== "en") return product;
  return {
    ...product,
    categoriaNombre: translateValue(product.categoriaNombre, language),
    nombre: translateValue(product.nombre, language),
    descripcion: translateValue(product.descripcion, language)
  };
}

export function localizeCategory(category, language) {
  if (language !== "en") return category;
  return {
    ...category,
    nombre: translateValue(category.nombre, language),
    descripcion: translateValue(category.descripcion, language)
  };
}

export function localizeOrder(order, language) {
  if (language !== "en") return order;
  return {
    ...order,
    mueble: translateValue(order.mueble, language),
    tamano: translateValue(order.tamano, language),
    estilo: translateValue(order.estilo, language),
    detalle: order.detalle?.map(item => ({
      ...item,
      productoNombre: translateValue(item.productoNombre, language)
    })) ?? order.detalle
  };
}
