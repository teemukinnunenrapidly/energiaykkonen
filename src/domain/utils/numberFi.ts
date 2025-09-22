export function parseFiNumber(input: any): number {
  if (input === undefined || input === null) {
    return 0;
  }
  const str = String(input).trim();
  if (!str) {
    return 0;
  }
  // Remove spaces as thousands separators and convert comma to dot
  const normalized = str.replace(/\s/g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isNaN(n) ? 0 : n;
}

export function formatFiNumber(n: number, fractionDigits = 0): string {
  if (typeof n !== 'number' || Number.isNaN(n)) {
    return '0';
  }
  if (fractionDigits > 0) {
    return n.toLocaleString('fi-FI', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
  return n.toLocaleString('fi-FI');
}
