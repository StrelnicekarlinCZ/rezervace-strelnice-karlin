export function money(value: number) {
  return `${Number(value || 0).toLocaleString('cs-CZ')} Kč`;
}

export function formatDateCZ(value?: string) {
  if (!value) return '—';
  const [y, m, d] = String(value).split('-');
  if (!y || !m || !d) return value;
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

export function csvCell(v: unknown) {
  return `"${String(v ?? '').replaceAll('"', '""')}"`;
}
