'use server';

import { getAdminFunnelMetrics, type FunnelMetrics } from '@/modules/admin/admin-funnel.service';

export async function getFunnelMetricsAction(): Promise<FunnelMetrics | null> {
  return getAdminFunnelMetrics();
}
