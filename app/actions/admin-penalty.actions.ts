'use server';

import { requireAdminRole } from './auth.actions';
import {
  getActivePenaltyConfig,
  getPenaltyConfigHistory,
  createPenaltyConfig,
  getConceptsCatalog,
  getComplianceState,
  updateComplianceProfile,
  simulatePenalty,
  type ComplianceProfile,
  type ComplianceState,
  type ConceptsCatalog,
  type PenaltyConfigResponse,
  type PenaltyResult,
  type SavePenaltyConfigRequest,
  type SimulatePenaltyRequest,
  type SimulatePenaltyResponse,
} from '@/modules/admin/admin-penalty.service';

export async function getActivePenaltyConfigAction(): Promise<PenaltyConfigResponse | null> {
  await requireAdminRole();
  return getActivePenaltyConfig();
}

export async function getPenaltyConfigHistoryAction(): Promise<PenaltyConfigResponse[]> {
  await requireAdminRole();
  return getPenaltyConfigHistory();
}

export async function createPenaltyConfigAction(
  request: SavePenaltyConfigRequest,
): Promise<PenaltyResult<PenaltyConfigResponse | null>> {
  await requireAdminRole();
  return createPenaltyConfig(request);
}

export async function getConceptsCatalogAction(): Promise<ConceptsCatalog | null> {
  await requireAdminRole();
  return getConceptsCatalog();
}

export async function getComplianceStateAction(): Promise<ComplianceState | null> {
  await requireAdminRole();
  return getComplianceState();
}

export async function updateComplianceProfileAction(
  profile: ComplianceProfile,
  reason: string,
): Promise<PenaltyResult<ComplianceState | null>> {
  await requireAdminRole();
  return updateComplianceProfile(profile, reason);
}

export async function simulatePenaltyAction(
  request: SimulatePenaltyRequest,
): Promise<PenaltyResult<SimulatePenaltyResponse>> {
  await requireAdminRole();
  return simulatePenalty(request);
}
