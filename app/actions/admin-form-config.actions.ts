'use server';

import {
  getAllFormConfigs,
  updateFormConfig,
  type AdminFormConfigResponse,
  type UpdateFormConfigRequest,
} from '@/modules/admin/admin-form-config.service';

export async function getAllFormConfigsAction(): Promise<AdminFormConfigResponse[]> {
  return getAllFormConfigs();
}

export async function updateFormConfigAction(
  module: string,
  request: UpdateFormConfigRequest,
): Promise<{ ok: boolean; data?: AdminFormConfigResponse; error?: string }> {
  return updateFormConfig(module, request);
}
