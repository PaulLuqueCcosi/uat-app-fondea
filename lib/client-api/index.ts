/**
 * Client API — Capa intermedia para client components.
 *
 * Los client components NUNCA llaman al backend directo.
 * Siempre pasan por esta capa, que hoy llama a las API routes
 * de Next.js (/api/...) y mañana puede cambiar sin tocar componentes.
 *
 * Para escritura (formularios) → usar Server Actions (app/actions/*.ts)
 * Para lectura en server components → usar backendFetch directo (lib/backend-fetch.ts)
 */

export {
  getActiveIntencion,
  getIntencionById,
  registerIntencion,
  createIntencion,
  updateIntencion,
  deleteIntencion,
} from './intenciones';
