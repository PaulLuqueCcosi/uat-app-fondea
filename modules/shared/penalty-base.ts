/**
 * Base sobre la que se calcula una mora porcentual. Fuente única de los textos: la usan la
 * configuración de mora del admin, el detalle del crédito y la vista del cliente.
 * Un rango sin base (`null`) se calcula sobre la cuota, igual que el backend.
 */
export type PenaltyBase = 'INSTALLMENT' | 'PRINCIPAL' | 'FEES';

export const PENALTY_BASE_OPTIONS: ReadonlyArray<{ value: PenaltyBase; label: string }> = [
  { value: 'INSTALLMENT', label: 'Monto de la cuota' },
  { value: 'PRINCIPAL', label: 'Monto del préstamo' },
  { value: 'FEES', label: 'Comisiones de la cuota (con IGV)' },
];

/** Nombre corto de la base, para columnas de tablas: "Cuota", "Capital", "Comisiones". */
export function penaltyBaseName(base: string | null): string {
  if (base === 'PRINCIPAL') return 'Capital';
  if (base === 'FEES') return 'Comisiones';
  if (base === 'INSTALLMENT') return 'Cuota';
  return '—';
}

/** Nombre completo de la base, para la vista del cliente. */
export function penaltyBaseDescription(base: string | null): string {
  if (base === 'PRINCIPAL') return 'Monto total del préstamo';
  if (base === 'FEES') return 'Comisiones de la cuota (con IGV)';
  return 'Monto de la cuota';
}

/** Complemento de frase: "0.5% <de la cuota> por día". */
export function penaltyBasePhrase(base: string | null, style: 'short' | 'long' = 'short'): string {
  if (base === 'PRINCIPAL') return style === 'long' ? 'del monto prestado' : 'del préstamo';
  if (base === 'FEES') return style === 'long' ? 'de las comisiones de la cuota (con IGV)' : 'de las comisiones';
  return 'de la cuota';
}
