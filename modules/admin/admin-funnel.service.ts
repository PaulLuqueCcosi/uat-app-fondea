/**
 * Service para el embudo de conversión (admin).
 * Endpoint: GET /api/v1/admin/calculator-intentions/funnel
 *
 * Separado de admin-intentions.service.ts porque es una funcionalidad
 * independiente (métricas agregadas), no parte del listado/gestión de intenciones.
 */

import { backendFetch } from '@/lib/backend-fetch';

export interface FunnelMetrics {
  period: { from: string; to: string };
  anonymousIntentions: number;
  linkedIntentions: number;
  portalIntentions: number;
  totalUserIntentions: number;
  applicationsSubmitted: number;
  applicationsApproved: number;
  conversionRates: {
    landingToRegister: number;
    intentionToApplication: number;
    applicationToApproval: number;
  };
}

export async function getAdminFunnelMetrics(): Promise<FunnelMetrics | null> {
  const res = await backendFetch('/api/v1/admin/calculator-intentions/funnel', {
    context: 'ADMIN_FUNNEL',
  });

  if (!res.ok) {
    console.error(`[ADMIN_FUNNEL] Error ${res.status}`);
    return null;
  }

  return res.json();
}
