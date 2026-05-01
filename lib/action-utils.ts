/**
 * Utilidades compartidas para server actions.
 * Centraliza el manejo de errores HTTP del backend.
 */

import type { ActionResult } from './types';

/**
 * Categoriza el código HTTP del backend en un ErrorCategory semántico
 * y extrae el mensaje de error del body JSON.
 */
export async function parseBackendResponse(res: Response): Promise<ActionResult> {
  // 2xx — éxito
  if (res.status >= 200 && res.status < 300) {
    return { success: true, httpStatus: res.status };
  }

  let message = 'Error al guardar.';
  try {
    const json = await res.json();
    message = json.detail ?? json.error ?? json.message ?? message;
  } catch {
    // body no es JSON — usar mensaje genérico
  }

  // 400 — validación / datos inválidos
  if (res.status === 400) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'validation',
      error: message,
    };
  }

  // 401 — no autenticado
  if (res.status === 401) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'auth',
      error: 'Tu sesión expiró. Por favor, vuelve a iniciar sesión.',
    };
  }

  // 403 — sin permisos
  if (res.status === 403) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'auth',
      error: 'No tienes permisos para realizar esta acción.',
    };
  }

  // 404 — recurso no encontrado
  if (res.status === 404) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'not_found',
      error: message || 'El recurso solicitado no existe.',
    };
  }

  // 409 — conflicto (ej: ya existe)
  if (res.status === 409) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'conflict',
      error: message,
    };
  }

  // 422 — entidad no procesable (validación semántica del backend)
  if (res.status === 422) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'validation',
      error: message,
    };
  }

  // 429 — rate limit
  if (res.status === 429) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'rate_limit',
      error: message || 'Demasiados intentos. Por favor, espera un momento.',
    };
  }

  // 5xx — error del servidor
  if (res.status >= 500) {
    return {
      success: false,
      httpStatus: res.status,
      errorCategory: 'server',
      error: 'Error en el servidor. Por favor, inténtalo más tarde.',
    };
  }

  // Cualquier otro código
  return {
    success: false,
    httpStatus: res.status,
    errorCategory: 'unknown',
    error: message,
  };
}

/** Error de red / conexión (fetch lanzó excepción) */
export function networkError(): ActionResult {
  return {
    success: false,
    httpStatus: 0,
    errorCategory: 'network',
    error: 'Error de conexión. Verifica tu internet e inténtalo nuevamente.',
  };
}
