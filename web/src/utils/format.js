// API prices arrive as strings (e.g. "12990.00"); always parse with Number()
// before formatting or sorting.
export function formatCurrency(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return '-';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(number);
}

export function toImageSrc(imageUrl) {
  if (!imageUrl) return undefined;
  return `/uploads/${imageUrl}`;
}
