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

// ─── Fecha + hora, siempre en hora de Perú ────────────────────────────────────────────────────

/**
 * Zona de referencia del producto. El backend corre con `-Duser.timezone=America/Lima` y sirve
 * `LocalDateTime` SIN zona (ej. `"2026-10-07T15:37:27"`) que ya vienen en hora de Perú.
 */
const PERU_TIME_ZONE = 'America/Lima';

/** Lo que `toLocaleString('es-PE')` muestra por defecto: "7/10/2026, 3:37:27 p. m.". */
const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};

/** ¿Trae zona o offset al final? (`Z`, `+02:00`, `-0500`). Un `LocalDateTime` no. */
function hasTimeZone(value: string): boolean {
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
}

/**
 * Formatea fecha y hora en hora de Perú, igual en el servidor (SSR) y en el navegador.
 *
 * <p><b>Por qué no `new Date(x).toLocaleString('es-PE')`:</b> depende del entorno de quien lo
 * ejecuta, y servidor y navegador no coinciden:
 * <ul>
 *   <li><b>Espacios:</b> Node escribe "p.&nbsp;m." con espacio duro (U+00A0) y Chrome con espacio
 *       normal. Se ve igual pero el texto difiere y React falla la hidratación.</li>
 *   <li><b>Zona:</b> usa la zona del que ejecuta. Un servidor en UTC mostraría la hora 5 horas
 *       adelantada respecto del navegador en Lima.</li>
 * </ul>
 *
 * <p>Reglas:
 * <ul>
 *   <li>Texto sin zona (`LocalDateTime` del backend): ya es hora de Perú — se muestra tal cual,
 *       sin convertir, usando UTC solo como vehículo para que ninguna zona local lo mueva.</li>
 *   <li>Texto con zona (`...Z`, `...-05:00`) o un `Date`: es un instante — se convierte a Lima.</li>
 * </ul>
 *
 * @param options mismas opciones que `Intl.DateTimeFormat`; por defecto, las de `toLocaleString('es-PE')`
 */
export function formatDateTimePeru(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_TIME_OPTIONS,
): string {
  if (value === null || value === undefined || value === '') return '—';

  let instant: Date;
  let timeZone: string;

  if (value instanceof Date) {
    instant = value;
    timeZone = PERU_TIME_ZONE;
  } else {
    const text = value.trim();
    const wallClock = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(text);

    if (wallClock && !hasTimeZone(text)) {
      const [, year, month, day, hour = '0', minute = '0', second = '0'] = wallClock;
      instant = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
      timeZone = 'UTC';
    } else {
      instant = new Date(text);
      timeZone = PERU_TIME_ZONE;
    }
  }

  if (Number.isNaN(instant.getTime())) return '—';

  return new Intl.DateTimeFormat('es-PE', { ...options, timeZone })
    .format(instant)
    // U+00A0 (Node) y U+202F (algunas versiones de ICU) → espacio normal, igual que el navegador.
    .replace(/[  ]/g, ' ');
}

/** Ej. "21 jul. 2026, 14:30" — para timestamps de auditoría y configuraciones. */
export function formatBackendDateTime(iso: string | null | undefined): string {
  return formatDateTimePeru(iso, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
