import { state } from "../state/state.js";

export function goToStep(n) {
  document.querySelectorAll("#clientApp .step").forEach(step => step.classList.remove("active"));
  document.getElementById(`step${n}`).classList.add("active");

  for (let i = 1; i <= 3; i++) {
    document.getElementById(`bar${i}`).style.width =
      i < n ? "100%" : (i === n ? "35%" : "0%");
    document.getElementById(`lbl${i}`).classList.toggle("active", i <= n);
  }
}

export function selectStyle(style) {
  state.style = style;
  document.querySelectorAll(".swatch-btn").forEach(button => {
    button.classList.toggle("selected", button.dataset.style === style);
  });
  document.getElementById("btnToStep2").disabled = false;
}
