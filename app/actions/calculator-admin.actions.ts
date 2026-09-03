'use server';

import { requireAdminRole } from './auth.actions';
import * as service from '@/modules/admin/calculator-admin.service';
import type { ConfigType, SimulateRequest } from '@/modules/admin/calculator-admin.service';

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getActiveSummaryAction() {
  await requireAdminRole();
  return service.getActiveSummary();
}

export async function getVersionsAction(type: ConfigType, limit?: number) {
  await requireAdminRole();
  return service.getVersions(type, limit);
}

export async function getVersionByIdAction(type: ConfigType, id: string) {
  await requireAdminRole();
  return service.getVersionById(type, id);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createVersionAction(type: ConfigType, data: any, name: string, description?: string) {
  await requireAdminRole();
  return service.createVersion(type, data, name, description);
}

export async function updateVersionAction(type: ConfigType, id: string, data: any, name?: string, description?: string) {
  await requireAdminRole();
  return service.updateVersion(type, id, data, name, description);
}

export async function activateVersionAction(type: ConfigType, id: string) {
  await requireAdminRole();
  return service.activateVersion(type, id);
}

export async function previewActivationImpactAction(type: ConfigType, id: string) {
  await requireAdminRole();
  return service.previewActivationImpact(type, id);
}

export async function duplicateVersionAction(type: ConfigType, id: string, newName?: string) {
  await requireAdminRole();
  return service.duplicateVersion(type, id, newName);
}

// ── Simulate ──────────────────────────────────────────────────────────────────

export async function simulateWithVersionsAction(body: SimulateRequest) {
  await requireAdminRole();
  return service.simulateWithVersions(body);
}
