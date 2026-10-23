import { state } from "../state/state.js";
import { escapeHtml } from "../utils/helpers.js";
import { t } from "../i18n.js";

export const AVAILABLE_COLORS = [
  { id: 1, key: "colorBlancoLino", nombre: "Blanco Lino", hex: "#F5F2EB", border: "#D5CEBF" },
  { id: 2, key: "colorVerdeSalvia", nombre: "Verde Salvia", hex: "#4A6B6C" },
  { id: 3, key: "colorTerracota", nombre: "Terracota", hex: "#D96B43" },
  { id: 4, key: "colorNogalClasico", nombre: "Nogal Clásico", hex: "#5A3D24" },
  { id: 5, key: "colorRobleNatural", nombre: "Roble Natural", hex: "#C49A6C" },
  { id: 6, key: "colorGrisCarbon", nombre: "Gris Carbón", hex: "#2D2A26" }
];

export function renderColorGrid() {
  const grid = document.getElementById("colorOptionsGrid");
  if (!grid) return;

  grid.innerHTML = AVAILABLE_COLORS.map(c => {
    const isSelected = state.color === c.nombre;
    const borderStyle = c.border ? `border: 1.5px solid ${c.border};` : "";
    return `
      <button
        type="button"
        class="color-option-btn ${isSelected ? "selected" : ""}"
        data-color="${escapeHtml(c.nombre)}"
        data-hex="${c.hex}"
        role="radio"
        aria-checked="${isSelected ? "true" : "false"}"
        onclick="window.selectColor('${escapeHtml(c.nombre)}', '${c.hex}')"
      >
        <span class="color-swatch-circle" style="background-color: ${c.hex}; ${borderStyle}"></span>
        <span class="color-option-name" data-i18n="${c.key}">${escapeHtml(t(c.key) || c.nombre)}</span>
      </button>
    `;
  }).join("");
}

export function selectColor(colorName, hex) {
  state.color = colorName;
  state.colorHex = hex;

  const errorBox = document.getElementById("colorSelectionError");
  if (errorBox) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
  }

  document.querySelectorAll(".color-option-btn").forEach(btn => {
    const isSelected = btn.dataset.color === colorName;
    btn.classList.toggle("selected", isSelected);
    btn.setAttribute("aria-checked", isSelected ? "true" : "false");
  });

  const btnStep2 = document.getElementById("btnToStep2");
  if (btnStep2) btnStep2.disabled = false;
}

export function selectStyle(style) {
  state.style = style;
  document.querySelectorAll(".swatch-btn").forEach(button => {
    button.classList.toggle("selected", button.dataset.style === style);
  });

  const colorContainer = document.getElementById("colorSelectorContainer");
  const btnStep2 = document.getElementById("btnToStep2");
  const errorBox = document.getElementById("colorSelectionError");
  if (errorBox) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
  }

  const requiresColor = style === "rallado" || style === "solo_color";

  if (requiresColor) {
    if (colorContainer) colorContainer.style.display = "block";
    renderColorGrid();
    if (btnStep2) {
      btnStep2.disabled = !state.color;
    }
  } else {
    // Si es "natural", ocultar el selector y no requerir color
    if (colorContainer) colorContainer.style.display = "none";
    state.color = null;
    state.colorHex = null;
    document.querySelectorAll(".color-option-btn").forEach(btn => {
      btn.classList.remove("selected");
      btn.setAttribute("aria-checked", "false");
    });
    if (btnStep2) btnStep2.disabled = false;
  }
}

export function goToStep(n) {
  if (n === 2) {
    const requiresColor = state.style === "rallado" || state.style === "solo_color";
    if (requiresColor && !state.color) {
      const errorBox = document.getElementById("colorSelectionError");
      if (errorBox) {
        errorBox.textContent = t("colorRequired");
        errorBox.style.display = "block";
      }
      return;
    }
  }

  document.querySelectorAll("#clientApp .step").forEach(step => step.classList.remove("active"));
  document.getElementById(`step${n}`).classList.add("active");

  for (let i = 1; i <= 3; i++) {
    document.getElementById(`bar${i}`).style.width =
      i < n ? "100%" : (i === n ? "35%" : "0%");
    document.getElementById(`lbl${i}`).classList.toggle("active", i <= n);
  }
}
