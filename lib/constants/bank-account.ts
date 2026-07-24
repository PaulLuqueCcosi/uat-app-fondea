// ─── Bank account constants ──────────────────────────────────────────────────

/**
 * Lista de bancos e instituciones financieras en Perú (general).
 * Base para las listas específicas.
 */
export const BANKS_PERU = [
  { value: 'BCP', label: 'BCP' },
  { value: 'BBVA', label: 'BBVA' },
  { value: 'Interbank', label: 'Interbank' },
  { value: 'Scotiabank', label: 'Scotiabank' },
  { value: 'Banco de la Nación', label: 'Banco de la Nación' },
  { value: 'Banco Pichincha', label: 'Banco Pichincha' },
  { value: 'BanBif', label: 'BanBif' },
  { value: 'Falabella', label: 'Falabella' },
  { value: 'Ripley', label: 'Ripley' },
  { value: 'Otro', label: 'Otro' },
] as const;

/**
 * Bancos para cuentas bancarias de desembolso.
 * Por ahora usa la lista completa, pero se puede customizar en el futuro.
 */
export const BANKS_FOR_ACCOUNT = BANKS_PERU;

/**
 * Instituciones financieras para deudas.
 * Por ahora usa la lista completa, pero se puede customizar en el futuro
 * (ej: agregar cajas municipales, financieras, etc.).
 */
export const BANKS_FOR_DEBTS = BANKS_PERU;

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'AHORROS',   label: 'Cuenta de ahorros' },
  { value: 'CORRIENTE', label: 'Cuenta corriente' },
] as const;
