'use server';

import {
  getAllScoreRanges,
  createScoreRange,
  updateScoreRange,
  deactivateScoreRange,
  activateScoreRange,
  uploadScoreRangeImage,
  type AdminScoreRange,
  type ScoreRangeMutationRequest,
  type ScoreRangeMutationResult,
  type ScoreRangeVoidResult,
  type ScoreRangeImageResult,
} from '@/modules/admin/admin-score-ranges.service';

export async function getAllScoreRangesAction(): Promise<AdminScoreRange[]> {
  return getAllScoreRanges();
}

export async function createScoreRangeAction(request: ScoreRangeMutationRequest): Promise<ScoreRangeMutationResult> {
  return createScoreRange(request);
}

export async function updateScoreRangeAction(
  id: string,
  request: ScoreRangeMutationRequest,
): Promise<ScoreRangeMutationResult> {
  return updateScoreRange(id, request);
}

export async function deactivateScoreRangeAction(id: string): Promise<ScoreRangeVoidResult> {
  return deactivateScoreRange(id);
}

export async function activateScoreRangeAction(id: string): Promise<ScoreRangeVoidResult> {
  return activateScoreRange(id);
}

export async function uploadScoreRangeImageAction(id: string, formData: FormData): Promise<ScoreRangeImageResult> {
  return uploadScoreRangeImage(id, formData);
}
