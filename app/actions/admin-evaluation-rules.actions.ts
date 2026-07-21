'use server';

import { requireAdminRole } from './auth.actions';
import * as service from '@/modules/admin/admin-evaluation-rules.service';
import type {
  RuleSetType,
  CreateRuleSetVersionRequest,
  PreviewEvaluationRequest,
} from '@/modules/admin/admin-evaluation-rules.service';

export async function listVersionsAction(type?: RuleSetType, productId?: string) {
  await requireAdminRole();
  return service.listVersions(type, productId);
}

export async function getVersionByIdAction(id: string) {
  await requireAdminRole();
  return service.getVersionById(id);
}

export async function createVersionAction(request: CreateRuleSetVersionRequest) {
  await requireAdminRole();
  return service.createVersion(request);
}

export async function activateVersionAction(id: string) {
  await requireAdminRole();
  return service.activateVersion(id);
}

export async function deactivateVersionAction(id: string) {
  await requireAdminRole();
  return service.deactivateVersion(id);
}

export async function simulateEvaluationAction(request: PreviewEvaluationRequest) {
  await requireAdminRole();
  return service.simulateEvaluation(request);
}

export async function getAvailableFieldsAction() {
  await requireAdminRole();
  return service.getAvailableFields();
}
