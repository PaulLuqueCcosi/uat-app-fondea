/**
 * Cliente de intenciones — DEPRECADO
 *
 * Este archivo ahora re-exporta directamente desde los server actions.
 * Las API routes proxy ya no son necesarias — los client components
 * pueden llamar a server actions directamente.
 *
 * TODO: Eliminar este archivo cuando todos los imports se actualicen
 * a importar directamente de '@/app/actions/intencion.actions'.
 */

export {
  getActiveIntencion,
  getIntencionConfig as getIntencionById,
  registerIntencion,
  createIntencion,
  updateIntencion,
  deleteIntencion,
} from '@/app/actions/intencion.actions';

export type { IntencionConfig } from '@/lib/types';
