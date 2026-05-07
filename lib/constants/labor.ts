// ─── Labor profile constants ─────────────────────────────────────────────────

export const LABOR_CONFIG = {
  /** Ingreso mensual mínimo aceptado (S/) */
  MIN_MONTHLY_INCOME: 500,
  /** RUC debe tener exactamente 11 dígitos */
  RUC_LENGTH: 11,
} as const;

export const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLEADO_DEPENDIENTE', label: 'Empleado en planilla' },
  { value: 'INDEPENDIENTE',        label: 'Trabajador independiente' },
  { value: 'EMPRESARIO',           label: 'Dueño de negocio' },
  { value: 'FREELANCE',            label: 'Freelancer / Consultor' },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: 'TECNOLOGIA',              label: 'Tecnología' },
  { value: 'SALUD',                   label: 'Salud' },
  { value: 'EDUCACION',               label: 'Educación' },
  { value: 'CONSTRUCCION',            label: 'Construcción' },
  { value: 'COMERCIO',                label: 'Comercio' },
  { value: 'SERVICIOS_PROFESIONALES', label: 'Servicios profesionales' },
  { value: 'OTRO',                    label: 'Otro' },
] as const;

export const ADDITIONAL_INCOME_TYPE_OPTIONS = [
  { value: 'ALQUILER',            label: 'Alquiler de propiedad' },
  { value: 'DIVIDENDOS',          label: 'Dividendos / inversiones' },
  { value: 'PENSION',             label: 'Pensión' },
  { value: 'FREELANCE',           label: 'Trabajo freelance' },
  { value: 'NEGOCIO_SECUNDARIO',  label: 'Negocio secundario' },
  { value: 'OTRO',                label: 'Otro' },
] as const;

export const INCOME_RECEIPT_OPTIONS = [
  { value: 'CUENTA_BANCARIA',   label: 'Cuenta bancaria' },
  { value: 'EFECTIVO',          label: 'Efectivo' },
  { value: 'BILLETERA_DIGITAL', label: 'Billetera digital (Yape, Plin, etc.)' },
  { value: 'OTROS', label: 'Otro' },
] as const;
