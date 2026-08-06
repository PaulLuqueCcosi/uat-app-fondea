/**
 * Types para el calendario de feriados del Libro de Reclamaciones (M4 / R32).
 * Usado para calcular el plazo legal de 15 días hábiles (Ley 31435/32495) —
 * ver BusinessDayCalculator en el backend.
 */

export interface AdminHoliday {
  id: string;
  /** ISO date (YYYY-MM-DD). Si recurring=true, el año es solo un ancla sin significado — solo importa mes/día. */
  date: string;
  description: string;
  /** true = aplica todos los años en el mismo mes/día (ej. Año Nuevo). false = solo esta fecha exacta (ej. Semana Santa, feriados puente). */
  recurring: boolean;
}

export interface AddHolidayRequest {
  date: string;
  description: string;
  recurring: boolean;
}
