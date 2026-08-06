/**
 * Service para el CRUD admin de rangos de puntaje (categorías del pasaporte).
 * OJO: esto es config GLOBAL (afecta a todos los usuarios), no puntaje de un usuario puntual
 * (ver admin-user-puntaje.service.ts para eso). Y no confundir con el score crediticio.
 *
 * Endpoints:
 * - GET    /api/v1/admin/score/rangos/all       (incluye inactivos)
 * - POST   /api/v1/admin/score/rangos
 * - PUT    /api/v1/admin/score/rangos/{id}
 * - DELETE /api/v1/admin/score/rangos/{id}      (soft-delete → isActive=false)
 * - PUT    /api/v1/admin/score/rangos/{id}/activate
 * - POST   /api/v1/admin/score/rangos/{id}/image   (multipart, max 10MB, JPEG/PNG/WEBP)
 */

import { backendFetch } from '@/lib/backend-fetch';

export interface AdminScoreRange {
  id: string;
  categoryName: string;
  imageUrl: string | null;
  minPoints: number;
  maxPoints: number | null;
  maxLoanAmount: number;
  isActive: boolean;
}

export interface ScoreRangeMutationRequest {
  categoryName: string;
  minPoints: number;
  maxPoints: number | null;
  maxLoanAmount: number;
}

export type ScoreRangeMutationResult =
  | { ok: true; data: AdminScoreRange }
  | { ok: false; error: string };

export type ScoreRangeVoidResult = { ok: true } | { ok: false; error: string };

function toRequestBody(req: ScoreRangeMutationRequest) {
  return JSON.stringify({
    category_name: req.categoryName,
    min_points: req.minPoints,
    max_points: req.maxPoints,
    max_loan_amount: req.maxLoanAmount,
  });
}

async function extractErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getAllScoreRanges(): Promise<AdminScoreRange[]> {
  const res = await backendFetch('/api/v1/admin/score/rangos/all', {
    context: 'ADMIN_SCORE_RANGES',
  });

  if (!res.ok) {
    console.error(`[ADMIN_SCORE_RANGES] Error ${res.status} al listar rangos`);
    return [];
  }

  return res.json();
}

export async function createScoreRange(request: ScoreRangeMutationRequest): Promise<ScoreRangeMutationResult> {
  const res = await backendFetch('/api/v1/admin/score/rangos', {
    context: 'ADMIN_SCORE_RANGES',
    method: 'POST',
    body: toRequestBody(request),
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al crear el rango: ${res.status}`);
    console.error(`[ADMIN_SCORE_RANGES] Error ${res.status} al crear rango: ${error}`);
    return { ok: false, error };
  }

  return { ok: true, data: await res.json() };
}

export async function updateScoreRange(
  id: string,
  request: ScoreRangeMutationRequest,
): Promise<ScoreRangeMutationResult> {
  const res = await backendFetch(`/api/v1/admin/score/rangos/${id}`, {
    context: 'ADMIN_SCORE_RANGES',
    method: 'PUT',
    body: toRequestBody(request),
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al editar el rango: ${res.status}`);
    console.error(`[ADMIN_SCORE_RANGES] Error ${res.status} al editar rango ${id}: ${error}`);
    return { ok: false, error };
  }

  return { ok: true, data: await res.json() };
}

export async function deactivateScoreRange(id: string): Promise<ScoreRangeVoidResult> {
  const res = await backendFetch(`/api/v1/admin/score/rangos/${id}`, {
    context: 'ADMIN_SCORE_RANGES',
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al desactivar el rango: ${res.status}`);
    console.error(`[ADMIN_SCORE_RANGES] Error ${res.status} al desactivar rango ${id}: ${error}`);
    return { ok: false, error };
  }

  return { ok: true };
}

export async function activateScoreRange(id: string): Promise<ScoreRangeVoidResult> {
  const res = await backendFetch(`/api/v1/admin/score/rangos/${id}/activate`, {
    context: 'ADMIN_SCORE_RANGES',
    method: 'PUT',
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al reactivar el rango: ${res.status}`);
    console.error(`[ADMIN_SCORE_RANGES] Error ${res.status} al reactivar rango ${id}: ${error}`);
    return { ok: false, error };
  }

  return { ok: true };
}

export type ScoreRangeImageResult = { ok: true; imageUrl: string } | { ok: false; error: string };

/**
 * Sube la imagen de un rango a S3 (bucket público) — reemplaza la anterior si existía.
 * `formData` debe traer un único campo "file" (así lo espera el backend).
 */
export async function uploadScoreRangeImage(id: string, formData: FormData): Promise<ScoreRangeImageResult> {
  const res = await backendFetch(`/api/v1/admin/score/rangos/${id}/image`, {
    context: 'ADMIN_SCORE_RANGES',
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await extractErrorDetail(res, `Error al subir la imagen: ${res.status}`);
    console.error(`[ADMIN_SCORE_RANGES] Error ${res.status} al subir imagen de rango ${id}: ${error}`);
    return { ok: false, error };
  }

  const data = await res.json();
  return { ok: true, imageUrl: data.imageUrl };
}
