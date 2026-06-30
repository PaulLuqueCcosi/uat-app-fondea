'use server';

import { requireAdminRole } from './auth.actions';
import * as service from '@/modules/admin/calculator-admin.service';
import type { ConfigType, SimulateDraftRequest } from '@/modules/admin/calculator-admin.service';

export async function saveDraftAction(type: ConfigType, data: any) {
  await requireAdminRole();
  return service.saveDraft(type, data);
}

export async function publishDraftAction(type: ConfigType) {
  await requireAdminRole();
  return service.publishDraft(type);
}

export async function discardDraftAction(type: ConfigType) {
  await requireAdminRole();
  return service.discardDraft(type);
}

export async function simulateWithDraftAction(body: SimulateDraftRequest) {
  await requireAdminRole();
  return service.simulateWithDraft(body);
}

export async function getConfigByTypeAction(type: ConfigType) {
  await requireAdminRole();
  return service.getConfigByType(type);
}
