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

export function formatEuros(value: number) {
  return euroFormatter.format(value);
}

export function formatCompactEuros(value: number) {
  return compactEuroFormatter.format(value);
}

export function formatPercent(value: number) {
  return percentFormatter.format(value / 100);
}
