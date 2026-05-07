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
