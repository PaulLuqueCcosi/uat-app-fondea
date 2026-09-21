const INTERNAL_PATTERNS = [
  /\.(java|class|xml|properties)\b/i,
  /\b(Exception|StackTrace|NullPointer|ClassCast)\b/,
  /\bat (com|org|java|pe)\./,
  /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b.*\b(FROM|WHERE|SET)\b/,
  /[A-Z][a-z]+[A-Z]\w+\.\w+\(/, // ClassName.method(
];

const MAX_SAFE_LENGTH = 200;

function isSafeMessage(msg: string): boolean {
  if (msg.length > MAX_SAFE_LENGTH) return false;
  return !INTERNAL_PATTERNS.some((p) => p.test(msg));
}

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'Los datos ingresados tienen un formato inválido.',
  401: 'Tu sesión expiró. Por favor, vuelve a iniciar sesión.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  409: 'Hubo un conflicto con los datos. Recargá la página e intentá de nuevo.',
  422: 'Los datos ingresados no son válidos.',
  429: 'Demasiados intentos. Intentá de nuevo más tarde.',
  500: 'Error del servidor. Intentá de nuevo en unos minutos.',
  502: 'Servicio temporalmente no disponible.',
  503: 'Servicio de validación temporalmente no disponible.',
};

function fallbackForStatus(status: number): string {
  if (STATUS_FALLBACKS[status]) return STATUS_FALLBACKS[status];
  if (status >= 500) return 'Error del servidor. Intentá de nuevo en unos minutos.';
  if (status >= 400) return 'Error en la solicitud. Verificá los datos e intentá de nuevo.';
  return 'Error inesperado. Por favor, intentá nuevamente.';
}

export function sanitizeErrorMessage(
  json: Record<string, unknown> | null | undefined,
  status: number,
  contextFallback?: string,
): string {
  if (!json) return contextFallback ?? fallbackForStatus(status);

  if (json.fieldErrors && typeof json.fieldErrors === 'object') {
    const firstError = Object.values(json.fieldErrors as Record<string, string>)[0];
    if (firstError && typeof firstError === 'string' && isSafeMessage(firstError)) {
      return firstError;
    }
  }

  const candidate =
    (json.message as string) ?? (json.detail as string) ?? (json.error as string);

  if (candidate && typeof candidate === 'string' && isSafeMessage(candidate)) {
    return candidate;
  }

  return contextFallback ?? fallbackForStatus(status);
}
