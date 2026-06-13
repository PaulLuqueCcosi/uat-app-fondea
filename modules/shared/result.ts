/**
 * Tipo Result genérico para módulos.
 *
 * Módulos con data estática o CMS usan este tipo.
 * Módulos con backend Java pueden usar ApiResult<T> (lib/types/common.ts)
 * o este mismo — depende de si necesitan fields/meta extra.
 */

export interface ModuleError {
  code: string;
  message: string;
  cause?: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ModuleError };
