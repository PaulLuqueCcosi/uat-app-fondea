'use server';

import {
  getActivePenaltyConfig,
  getPenaltyConfigHistory,
  createPenaltyConfig,
  type PenaltyConfigResponse,
  type SavePenaltyConfigRequest,
} from '@/modules/admin/admin-penalty.service';

export async function getActivePenaltyConfigAction(): Promise<PenaltyConfigResponse | null> {
  return getActivePenaltyConfig();
}

export async function getPenaltyConfigHistoryAction(): Promise<PenaltyConfigResponse[]> {
  return getPenaltyConfigHistory();
}

export async function createPenaltyConfigAction(
  request: SavePenaltyConfigRequest,
): Promise<{ ok: boolean; data?: PenaltyConfigResponse; error?: string }> {
  return createPenaltyConfig(request);
}
