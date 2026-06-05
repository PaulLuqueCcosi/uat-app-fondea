// ─── Server Action Results ───────────────────────────────────────────────────

export type ErrorCategory =
  | 'validation'
  | 'auth'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'unknown';

export type ActionResult =
  | { success: true; httpStatus: number }
  | {
      success: false;
      httpStatus: number;
      errorCategory: ErrorCategory;
      error: string;
    };

// ─── ApiResult — Tipo estandarizado para TODAS las llamadas al backend ───────
//
// Uso en el frontend:
//   const result = await getActiveIntencion();
//   if (result.ok) { ... result.data ... }
//   else { showError(result.error); }
//

/** Error estructurado que siempre llega al frontend */
export interface ApiError {
  /** Categoría para decidir qué UI mostrar (toast, redirect, inline, etc.) */
  category: ErrorCategory;
  /** Mensaje legible para el usuario */
  message: string;
  /** HTTP status del backend (0 = no se pudo conectar) */
  status: number;
  /** Errores por campo — para resaltar inputs específicos */
  fields?: Record<string, string>;
  /** Metadata extra (attemptsLeft, blockedHoursLeft, etc.) */
  meta?: Record<string, unknown>;
}

/** Resultado exitoso */
export interface ApiOk<T> {
  ok: true;
  data: T;
}

/** Resultado fallido */
export interface ApiFail {
  ok: false;
  error: ApiError;
}

/** Tipo unión que todos los actions pueden retornar */
export type ApiResult<T = void> = ApiOk<T> | ApiFail;

// ─── Shared enums ────────────────────────────────────────────────────────────

export type LoanPurpose =
  | 'EDUCACION'
  | 'SALUD'
  | 'NEGOCIO'
  | 'VIAJE'
  | 'HOGAR'
  | 'DEUDAS'
  | 'OTRO';

export type EducationLevel =
  | 'PRIMARIA'
  | 'SECUNDARIA'
  | 'TECNICA'
  | 'UNIVERSITARIA'
  | 'POSGRADO'
  | 'OTRO';

export type ReferralSource =
  | 'REDES_SOCIALES'
  | 'RECOMENDACION'
  | 'GOOGLE'
  | 'PUBLICIDAD'
  | 'OTRO';

export type AccountType = 'AHORROS' | 'CORRIENTE';

export type ContactMethod = 'whatsapp' | 'sms' | 'email' | 'call';
