// Stock threshold semantics (docs/03-MODELO-DATOS.md "Umbrales de stock"):
// minimum_stock <= low_stock <= high_stock. Checks are intentionally strict
// (`<` / `>`), so a value that lands exactly on a threshold falls through to
// the next, milder check instead of being flagged.
const STATUS_STYLES = {
  critical: { color: '#b42318', background: '#fef3f2' },
  low: { color: '#b54708', background: '#fef6ee' },
  ok: { color: '#067647', background: '#ecfdf3' },
  overstock: { color: '#175cd3', background: '#eff8ff' },
};

// Rank used to sort "needs attention first": critical < low < ok < overstock.
export const STOCK_STATUS_ORDER = ['critical', 'low', 'ok', 'overstock'];

export function stockStatus({ current, minimum, low, high }) {
  if (current < minimum) return { status: 'critical', label: 'Below minimum' };
  if (current < low) return { status: 'low', label: 'Low stock' };
  if (current > high) return { status: 'overstock', label: 'Overstock' };
  return { status: 'ok', label: 'Healthy' };
}

export function stockStatusRank({ current, minimum, low, high }) {
  return STOCK_STATUS_ORDER.indexOf(stockStatus({ current, minimum, low, high }).status);
}

// Presentational only: pure props in, markup out. No data fetching (see
// ADR-011 Container/Presentational).
export default function StockGauge({ current, minimum, low, high }) {
  const { status, label } = stockStatus({ current, minimum, low, high });
  const style = STATUS_STYLES[status];

  // The bar never saturates on overstock: the scale extends 20% past
  // whichever is larger, the high threshold or the current value. Guarded
  // against an all-zero product (no stock configured yet) so the bar never
  // divides by zero.
  const scaleMax = Math.max(high, current, 1) * 1.2;
  const toPercent = (value) => Math.min(100, Math.max(0, (value / scaleMax) * 100));

  const ariaLabel = `Stock ${current} of ${Math.round(scaleMax)} — minimum ${minimum}, low ${low}, high ${high}`;

  return (
    <div className="stock-gauge" role="img" aria-label={ariaLabel}>
      <span className="stock-gauge-pill" style={{ color: style.color, backgroundColor: style.background }}>
        {label}
      </span>
      <div className="stock-gauge-bar">
        <div className="stock-gauge-fill" style={{ width: `${toPercent(current)}%`, backgroundColor: style.color }} />
        <span className="stock-gauge-tick" style={{ left: `${toPercent(minimum)}%` }} />
        <span className="stock-gauge-tick" style={{ left: `${toPercent(low)}%` }} />
        <span className="stock-gauge-tick" style={{ left: `${toPercent(high)}%` }} />
      </div>
      <span className="stock-gauge-value vf-mono">{current}</span>
    </div>
  );
}
