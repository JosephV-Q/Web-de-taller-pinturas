import { createProduct, deleteProduct, getProductCategories, getProducts, updateProduct } from "../services/products.js";
import { escapeHtml } from "../utils/helpers.js";
import { t } from "../i18n.js";

let products = [];
let editingId = null;

function formValue(id) { return document.getElementById(id).value; }
function showFormError(message = "") {
  const box = document.getElementById("productFormError");
  box.textContent = message;
  box.style.display = message ? "block" : "none";
}

function setProductMode(mode) {
  const isForm = mode === "form";
  document.getElementById("productFormView").style.display = isForm ? "block" : "none";
  document.getElementById("productListView").style.display = isForm ? "none" : "block";
  document.getElementById("newProduct").style.display = isForm ? "none" : "inline-block";
}

function resetForm() {
  editingId = null;
  document.getElementById("productForm").reset();
  document.getElementById("saveProduct").textContent = t("createProduct");
  showFormError();
  setProductMode("list");
}

function fillForm(product) {
  editingId = product.id;
  document.getElementById("productName").value = product.nombre;
  document.getElementById("productCategory").value = product.categoriaId;
  document.getElementById("productPrice").value = product.precio;
  document.getElementById("productQuantity").value = product.cantidadDisponible;
  document.getElementById("productMinimum").value = product.stockMinimo;
  document.getElementById("productStatus").value = product.estado;
  document.getElementById("productImage").value = product.imagenUrl || "";
  document.getElementById("productDescription").value = product.descripcion || "";
  document.getElementById("saveProduct").textContent = t("updateProduct");
  setProductMode("form");
  document.getElementById("productName").focus();
}

function renderProducts() {
  const container = document.getElementById("ownerProducts");
  container.innerHTML = products.length ? `<table class="product-table"><thead><tr><th>${t("productName")}</th><th>${t("productPrice")}</th><th>${t("productQuantity")}</th><th>${t("productStatus")}</th><th>${t("actions")}</th></tr></thead><tbody></tbody></table>` : `<p class="empty-note">${t("noProducts")}</p>`;
  const body = container.querySelector("tbody");
  products.forEach(product => {
    const row = document.createElement("tr");
    row.innerHTML = `<td><strong>${escapeHtml(product.nombre)}</strong><small>${escapeHtml(product.categoriaNombre || "")}</small></td><td>${product.precio}</td><td>${product.cantidadDisponible}</td><td><span class="badge ${product.estado === "activo" ? "disponible" : "inactivo"}">${t(product.estado === "activo" ? "active" : "inactive")}</span></td><td><button class="link-btn edit-product" type="button">${t("edit")}</button><button class="link-btn delete-product" type="button">${t("delete")}</button></td>`;
    row.querySelector(".edit-product").addEventListener("click", () => fillForm(product));
    row.querySelector(".delete-product").addEventListener("click", () => removeProduct(product));
    body?.appendChild(row);
  });
}

async function removeProduct(product) {
  if (!window.confirm(`${t("confirmDelete")} "${product.nombre}"?`)) return;
  try { await deleteProduct(product.id); await loadOwnerProducts(); } catch (error) { showFormError(error.message); }
}

async function loadCategories() {
  const categories = await getProductCategories();
  document.getElementById("productCategory").innerHTML = categories.map(category => `<option value="${category.id}">${escapeHtml(category.nombre)}</option>`).join("");
}

async function loadOwnerProducts() {
  try { products = await getProducts({ includeInactive: true }); renderProducts(); } catch (error) { document.getElementById("ownerProducts").innerHTML = `<p class="error">${escapeHtml(error.message || t("productsError"))}</p>`; }
}

async function saveProduct(event) {
  event.preventDefault();
  showFormError();
  const product = { nombre: formValue("productName"), categoriaId: Number(formValue("productCategory")), precio: Number(formValue("productPrice")), cantidadDisponible: Number(formValue("productQuantity")), stockMinimo: Number(formValue("productMinimum")), estado: formValue("productStatus"), imagenUrl: formValue("productImage"), descripcion: formValue("productDescription") };
  const form = document.getElementById("productForm");
  const saveButton = document.getElementById("saveProduct");
  form.querySelectorAll("input, select, textarea, button").forEach(control => { control.disabled = true; });
  try {
    if (editingId) await updateProduct(editingId, product); else await createProduct(product);
    resetForm();
    await loadOwnerProducts();
  } catch (error) {
    form.querySelectorAll("input, select, textarea, button").forEach(control => { control.disabled = false; });
    saveButton.textContent = editingId ? t("updateProduct") : t("createProduct");
    showFormError(error.message);
  }
}

export async function loadOwnerProductsSection() { await Promise.all([loadCategories(), loadOwnerProducts()]); }

export function initOwnerProducts() {
  window.loadOwnerProducts = loadOwnerProductsSection;
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("cancelProductEdit").addEventListener("click", resetForm);
  document.getElementById("newProduct").addEventListener("click", () => {
    resetForm();
    setProductMode("form");
    document.getElementById("productName").focus();
  });
}