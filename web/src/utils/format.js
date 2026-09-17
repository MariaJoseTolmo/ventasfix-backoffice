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

// VAT contributed by a product: sale_price - net_price (sale_price is
// net_price recalculated with the tax rate by the API's model hook).
export function formatVatDelta(netPrice, salePrice) {
  const net = Number(netPrice);
  const sale = Number(salePrice);
  if (Number.isNaN(net) || Number.isNaN(sale)) return null;
  return `+${formatCurrency(sale - net)} VAT`;
}
