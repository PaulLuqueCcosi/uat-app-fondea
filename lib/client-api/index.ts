/**
 * Client API — DEPRECADO
 *
 * Los client components ahora llaman directamente a los server actions.
 * Este archivo se mantiene temporalmente para backward compatibility.
 *
 * Migrar imports a: import { ... } from '@/app/actions/intencion.actions'
 */

export {
  getActiveIntencion,
  getIntencionById,
  registerIntencion,
  createIntencion,
  updateIntencion,
  deleteIntencion,
} from './intenciones';
