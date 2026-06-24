export const euroFormatter = new Intl.NumberFormat('ca-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export const compactEuroFormatter = new Intl.NumberFormat('ca-ES', {
  compactDisplay: 'short',
  currency: 'EUR',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
});

export const percentFormatter = new Intl.NumberFormat('ca-ES', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: 'percent',
});

function safeFormatNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function formatEuros(value: number) {
  return euroFormatter.format(safeFormatNumber(value));
}

export function formatCompactEuros(value: number) {
  return compactEuroFormatter.format(safeFormatNumber(value));
}

export function formatPercent(value: number) {
  return percentFormatter.format(safeFormatNumber(value) / 100);
}
