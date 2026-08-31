/**
 * Parseo y formateo de fechas que vienen del backend Java.
 *
 * <p><b>El problema que resuelve:</b> el backend serializa `LocalDate` como `"2026-07-21"`
 * (sin hora ni zona). `new Date('2026-07-21')` NO lo interpreta como fecha local — el
 * estándar dice que un ISO date-only se parsea como medianoche UTC. En Perú (UTC-5) eso
 * cae el 20 a las 19:00, así que `toLocaleDateString('es-PE')` renderiza **el día
 * anterior** al vencimiento real.
 *
 * <p>Se veía en todas las fechas de vencimiento del cronograma, y además rompía la
 * comparación de días en el calendario: al hacer clic en el día correcto no encontraba
 * la cuota.
 *
 * <p>Los `LocalDateTime` (que sí traen hora, ej. `"2026-07-21T14:30:00"`) no tienen este
 * problema: el estándar los parsea como hora local. Las funciones de acá detectan el
 * formato y aplican el parseo correcto en cada caso.
 */

/** ¿Es un `LocalDate` del backend (solo fecha, sin hora)? */
function isDateOnly(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso.trim());
}

/**
 * Parsea una fecha del backend respetando la zona local.
 *
 * @param iso `"YYYY-MM-DD"` (LocalDate) o `"YYYY-MM-DDTHH:mm:ss"` (LocalDateTime)
 */
export function parseBackendDate(iso: string): Date {
  const value = iso.trim();
  if (isDateOnly(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

/** Ej. "21 jul. 2026". */
export function formatBackendDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return parseBackendDate(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Ej. "21 jul." — para espacios reducidos donde el año es redundante. */
export function formatBackendDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  return parseBackendDate(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
  });
}

/** Ej. "21 de julio de 2026" — para textos donde la fecha es el dato principal. */
export function formatBackendDateLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  return parseBackendDate(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Ej. "21 de julio" — sin año, para vencimientos del ciclo en curso. */
export function formatBackendDayMonth(iso: string | null | undefined): string {
  if (!iso) return '—';
  return parseBackendDate(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
  });
}
