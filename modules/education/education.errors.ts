/**
 * Errores del módulo Educación.
 *
 * Cada error tiene:
 * - code: identificador para que el componente decida qué UI mostrar
 * - message: texto legible para el usuario
 * - cause: detalle técnico para logs (no se muestra)
 */

export type EducationErrorCode =
  | 'MODULE_NOT_FOUND'
  | 'MODULES_EMPTY'
  | 'CMS_UNAVAILABLE'
  | 'INVALID_MODULE_DATA';

export interface EducationError {
  code: EducationErrorCode;
  message: string;
  cause?: string;
}

export const errors = {
  moduleNotFound: (id: string): EducationError => ({
    code: 'MODULE_NOT_FOUND',
    message: 'El módulo que buscas no existe o fue eliminado.',
    cause: `Module id="${id}" not found`,
  }),

  modulesEmpty: (): EducationError => ({
    code: 'MODULES_EMPTY',
    message: 'No hay módulos disponibles en este momento.',
    cause: 'Data source returned empty array',
  }),

  cmsUnavailable: (detail?: string): EducationError => ({
    code: 'CMS_UNAVAILABLE',
    message: 'No pudimos cargar el contenido educativo. Intenta en unos minutos.',
    cause: detail ?? 'CMS fetch failed',
  }),

  invalidData: (detail: string): EducationError => ({
    code: 'INVALID_MODULE_DATA',
    message: 'El contenido no se pudo procesar correctamente.',
    cause: detail,
  }),
};
