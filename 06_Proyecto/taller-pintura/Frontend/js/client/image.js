import { state } from "../state/state.js";
import { t } from "../i18n.js";

export function initImageUpload() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  fileInput.addEventListener("change", event => {
    if (event.target.files[0]) handleFile(event.target.files[0]);
  });

  dropzone.addEventListener("dragover", event => {
    event.preventDefault();
    dropzone.classList.add("drag");
  });

  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));

  dropzone.addEventListener("drop", event => {
    event.preventDefault();
    dropzone.classList.remove("drag");
    if (event.dataTransfer.files[0]) handleFile(event.dataTransfer.files[0]);
  });
}

function handleFile(file) {
  document.getElementById("step2Error").innerHTML = "";

  if (!file.type.startsWith("image/")) {
    document.getElementById("step2Error").innerHTML =
      `<div class="error">${t("fileError")}</div>`;
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    const img = new Image();

    img.onload = () => {
      const maxDim = 1024;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      state.imageBase64 = dataUrl.split(",")[1];
      state.mediaType = "image/jpeg";

      document.getElementById("previewImg").src = dataUrl;
      document.getElementById("previewName").textContent = file.name;
      document.getElementById("dropzoneWrap").style.display = "none";
      document.getElementById("previewWrap").style.display = "block";
      document.getElementById("btnCotizar").disabled = false;
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

export function resetImage() {
  state.imageBase64 = null;
  state.mediaType = null;
  document.getElementById("dropzoneWrap").style.display = "block";
  document.getElementById("previewWrap").style.display = "none";
  document.getElementById("btnCotizar").disabled = true;
  document.getElementById("fileInput").value = "";
}
