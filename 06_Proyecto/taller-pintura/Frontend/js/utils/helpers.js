export function capitalize(value) {
  return (value || "").charAt(0).toUpperCase() + (value || "").slice(1);
}

export function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function averageRating(ratings) {
  if (!ratings.length) return null;
  return ratings.reduce((sum, rating) => sum + rating.estrellas, 0) / ratings.length;
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
