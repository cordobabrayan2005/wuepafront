const copCurrencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCopCurrency(value: number) {
  return copCurrencyFormatter.format(value);
}