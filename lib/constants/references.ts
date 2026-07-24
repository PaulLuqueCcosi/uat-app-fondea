// ─── References constants ────────────────────────────────────────────────────

export const YEARS_KNOWN_OPTIONS = [
  { value: 'MENOS_DE_1_ANIO', label: 'Menos de 1 año' },
  { value: 'DE_1_A_3_ANIOS',  label: '1 a 3 años' },
  { value: 'MAS_DE_3_ANIOS',  label: 'Más de 3 años' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getYearsKnownLabel(value: string | undefined | null): string {
  if (!value) return '—';
  const option = YEARS_KNOWN_OPTIONS.find(opt => opt.value === value);
  return option?.label ?? value;
}
