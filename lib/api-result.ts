/**
 * API RESULT — Parser universal para respuestas del backend.
 *
 * Convierte cualquier Response del backend en un ApiResult<T> estandarizado.
 * Los actions solo necesitan llamar a parseResponse() en vez de escribir
 * su propio parser de 80 líneas.
 *
 * Uso:
 *   const res = await backendFetch('/api/v1/labor/validate', { method: 'PUT', body });
 *   return parseResponse<void>(res, 'datos laborales');
 *
 *   const res = await backendFetch('/api/v1/intentions/active');
 *   return parseResponse<IntencionConfig>(res, 'intención');
 */

import type { ApiResult, ApiError, ErrorCategory } from '@/lib/types/common';

// Re-export para conveniencia
export type { ApiResult, ApiOk, ApiFail, ApiError } from '@/lib/types/common';

// ── Opciones del parser ───────────────────────────────────────────────────────

interface ParseOptions {
  /**
   * Contexto para mensajes de error genéricos.
   * Ej: 'datos laborales' → "Los datos laborales no son válidos."
   */
  context?: string;
  /**
   * Si true, parsea el body JSON en éxito y lo devuelve como `data`.
   * Si false, devuelve `void` como data (útil para PUT/DELETE sin respuesta).
   * @default true
   */
  parseBody?: boolean;
}

// ── Parser principal ──────────────────────────────────────────────────────────

/**
 * Parsea una Response del backend en un ApiResult<T> estandarizado.
 *
 * - 2xx → { ok: true, data: T }
 * - 4xx/5xx → { ok: false, error: ApiError }
 * - Network error → usar apiNetworkError() antes de llamar esto
 */
export async function parseResponse<T = void>(
  res: Response,
  options: ParseOptions | string = {},
): Promise<ApiResult<T>> {
  // Permitir pasar solo el contexto como string
  const opts: ParseOptions = typeof options === 'string' ? { context: options } : options;
  const { context = 'solicitud', parseBody = true } = opts;

  // ── Éxito (2xx) ─────────────────────────────────────────────────────────
  if (res.status >= 200 && res.status < 300) {
    if (!parseBody) {
      return { ok: true, data: undefined as T };
    }

    try {
      const data = await res.json();
      return { ok: true, data: data as T };
    } catch {
      // Body vacío en un 204 por ejemplo
      return { ok: true, data: undefined as T };
    }
  }

  // ── Error — parsear body ────────────────────────────────────────────────
  let json: any = {};
  try {
    json = await res.json();
  } catch {
    // Body vacío o no-JSON
  }

  const error = buildError(res.status, json, context);
  return { ok: false, error };
}

// ── Builder de errores ────────────────────────────────────────────────────────

function buildError(status: number, json: any, context: string): ApiError {
  // Extraer mensaje — el backend puede usar message, detail, o error
  const backendMessage: string | undefined =
    json.message ?? json.detail ?? json.error;

  // Extraer field errors si existen
  const fields: Record<string, string> | undefined =
    json.fieldErrors && Object.keys(json.fieldErrors).length > 0
      ? json.fieldErrors
      : undefined;

  // Metadata extra (intentos, bloqueo, etc.)
  const meta: Record<string, unknown> = {};
  if (json.attempts_left !== undefined || json.attemptsLeft !== undefined) {
    meta.attemptsLeft = json.attempts_left ?? json.attemptsLeft;
  }
  if (json.max_attempts !== undefined || json.maxAttempts !== undefined) {
    meta.maxAttempts = json.max_attempts ?? json.maxAttempts;
  }
  if (json.blocked_hours_left !== undefined || json.blockedHoursLeft !== undefined) {
    meta.blockedHoursLeft = json.blocked_hours_left ?? json.blockedHoursLeft;
  }

  // Categorizar por HTTP status
  switch (status) {
    case 400:
      return {
        category: 'validation',
        message: firstFieldError(fields) ?? backendMessage ?? `Los ${context} tienen un formato inválido.`,
        status,
        fields,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      };

    case 401:
      return {
        category: 'auth',
        message: 'Tu sesión expiró. Por favor, vuelve a iniciar sesión.',
        status,
      };

    case 403:
      return {
        category: 'auth',
        message: 'No tienes permisos para realizar esta acción.',
        status,
      };

    case 404:
      return {
        category: 'not_found',
        message: backendMessage ?? 'El recurso solicitado no existe.',
        status,
      };

    case 409:
      return {
        category: 'conflict',
        message: backendMessage ?? 'Esta operación no se puede realizar en este momento.',
        status,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      };

    case 422: {
      // Validación semántica — consume intento
      let message = backendMessage ?? `Los ${context} no son válidos.`;
      const attemptsLeft = meta.attemptsLeft as number | undefined;
      if (attemptsLeft === 1) {
        message += ' ¡Cuidado! Este es tu último intento.';
      } else if (attemptsLeft !== undefined && attemptsLeft > 0) {
        message += ` Te quedan ${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''}.`;
      }
      return {
        category: 'validation',
        message,
        status,
        fields,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      };
    }

    case 429: {
      const hours = (meta.blockedHoursLeft as number) ?? 24;
      return {
        category: 'rate_limit',
        message: backendMessage ?? `Demasiados intentos. Cuenta bloqueada por ${hours} hora${hours !== 1 ? 's' : ''}.`,
        status,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      };
    }

    case 503:
      return {
        category: 'server',
        message: backendMessage ?? 'Servicio temporalmente no disponible. Inténtalo en unos minutos.',
        status,
      };

    default:
      if (status >= 500) {
        return {
          category: 'server',
          message: 'Error en el servidor. Inténtalo más tarde.',
          status,
        };
      }
      return {
        category: 'unknown',
        message: backendMessage ?? 'Error inesperado. Inténtalo nuevamente.',
        status,
      };
  }
}

// ── Errores pre-fabricados ────────────────────────────────────────────────────

/** Para usar cuando backendFetch devuelve status 0 (network error) o lanza excepción */
export function apiNetworkError(): ApiResult<never> {
  return {
    ok: false,
    error: {
      category: 'network',
      message: 'Error de conexión. Verifica tu internet e inténtalo nuevamente.',
      status: 0,
    },
  };
}

/** Para usar cuando no hay token / sesión expirada */
export function apiAuthError(): ApiResult<never> {
  return {
    ok: false,
    error: {
      category: 'auth',
      message: 'Tu sesión expiró. Por favor, vuelve a iniciar sesión.',
      status: 401,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstFieldError(fields?: Record<string, string>): string | undefined {
  if (!fields) return undefined;
  const values = Object.values(fields);
  return values.length > 0 ? values[0] : undefined;
}

// ── Type guard para usar en el frontend ───────────────────────────────────────

/** Chequea si un ApiResult es exitoso — útil como type guard */
export function isOk<T>(result: ApiResult<T>): result is { ok: true; data: T } {
  return result.ok;
}
