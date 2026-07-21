'use server';

import {
  getScorecardConfigs,
  getActiveConfig,
  getConfigById,
  createConfig,
  updateConfig,
  activateConfig,
  getScorecardMetadata,
  simulateScore,
  recalculateScore,
} from '@/modules/admin/scoring';

export async function fetchConfigs() {
  return getScorecardConfigs();
}

export async function fetchActiveConfig() {
  return getActiveConfig();
}

export async function fetchConfigById(id: string) {
  return getConfigById(id);
}

export async function fetchMetadata() {
  return getScorecardMetadata();
}

export async function createNewConfig(data: {
  name: string;
  description: string;
  maxScore: number;
  dimensionsJson: string;
}) {
  return createConfig(data);
}

export async function updateExistingConfig(id: string, data: {
  name: string;
  description: string;
  maxScore: number;
  dimensionsJson: string;
}) {
  return updateConfig(id, data);
}

export async function activateExistingConfig(id: string) {
  return activateConfig(id);
}

export async function simulateUserScore(userId: string, configId: string) {
  return simulateScore(userId, configId);
}

export async function recalculateUserScore(userId: string) {
  return recalculateScore(userId);
}
