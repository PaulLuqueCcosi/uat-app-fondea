/**
 * Obtiene el mensaje/subtítulo personalizado del dashboard.
 *
 * HOY: mock estático.
 * MAÑANA: puede depender del estado del usuario (tiene préstamo activo,
 * tiene cuota próxima, expediente incompleto, etc.)
 *
 * Solo se cambia aquí.
 */
export async function getUserSubtitle(): Promise<string | null> {
  // TODO: reemplazar por lógica real basada en el estado del usuario
  return 'Tienes una solicitud en curso. Continúa donde lo dejaste.';
}
