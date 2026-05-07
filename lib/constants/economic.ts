// ─── Economic profile constants ──────────────────────────────────────────────

export const LOAN_PURPOSE_OPTIONS = [
  { value: 'EDUCACION', label: 'Educación' },
  { value: 'SALUD',     label: 'Salud / Emergencia médica' },
  { value: 'NEGOCIO',   label: 'Capital de negocio' },
  { value: 'VIAJE',     label: 'Viaje' },
  { value: 'HOGAR',     label: 'Mejoras del hogar' },
  { value: 'DEUDAS',    label: 'Pagar deudas' },
  { value: 'OTRO',      label: 'Otro' },
] as const;

export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'PRIMARIA',      label: 'Primaria' },
  { value: 'SECUNDARIA',    label: 'Secundaria' },
  { value: 'TECNICA',       label: 'Técnica / Superior no universitaria' },
  { value: 'UNIVERSITARIA', label: 'Universitaria' },
  { value: 'POSGRADO',      label: 'Posgrado / Maestría / Doctorado' },
  { value: 'OTRO',          label: 'Otro' },
] as const;
