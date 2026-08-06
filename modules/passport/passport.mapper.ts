/**
 * Mapper: respuesta del backend → tipos del frontend.
 *
 * Backend endpoints:
 * - GET /api/v1/score → { points, maxLoanAmount, categoryName }
 * - GET /api/v1/score/rangos → [{ categoryName, minPoints, maxPoints, maxLoanAmount, isActive }]
 * - GET /api/v1/score/historial → [{ id, points, type, reason, reference_id, created_at }]
 */

import type { PassportSummary, PassportLevel, PassportLevelMeta, PointsHistoryEntry } from './passport.types';

// ── Mapeo visual por nombre de categoría ──────────────────────────────────────

const LEVEL_META: Record<string, PassportLevelMeta> = {
  BRONCE: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    image: '/levels/Bronze.png',
  },
  PLATA: {
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-50',
    borderColor: 'border-neutral-300',
    image: '/levels/Silver.png',
  },
  ORO: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    image: '/levels/Gold.png',
  },
  MASTER: {
    color: 'text-primary-700',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    image: '/levels/Master.png',
  },
};

const DEFAULT_META: PassportLevelMeta = {
  color: 'text-neutral-700',
  bgColor: 'bg-neutral-50',
  borderColor: 'border-neutral-200',
  image: '',
};

// ── Imagen por defecto por categoría ───────────────────────────────────────────
// El admin puede subir una imagen custom por rango (queda en data.imageUrl, vía S3).
// Mientras no la suba, usamos estas imágenes locales de marca en vez de dejar el
// <img> sin src (rompe el render — el navegador interpreta src="" como la página actual).
const LEVEL_FALLBACK_IMAGE: Record<string, string> = {
  BRONCE: '/levels/Bronze.png',
  PLATA: '/levels/Silver.png',
  ORO: '/levels/Gold.png',
  MASTER: '/levels/Master.png',
};

// ── Mapeo de nombres de categoría para la UI ──────────────────────────────────

const LEVEL_DISPLAY_NAMES: Record<string, string> = {
  BRONCE: 'Bronce',
  PLATA: 'Plata',
  ORO: 'Oro',
  MASTER: 'Master',
};

// ── Mappers ───────────────────────────────────────────────────────────────────

/**
 * Combina la respuesta de /api/v1/score + /api/v1/score/rangos → PassportSummary.
 */
export function mapSummaryFromBackend(
  scoreData: { points: number; maxLoanAmount: number; categoryName: string },
  rangosData: Array<{ categoryName: string; minPoints: number; maxPoints: number | null; maxLoanAmount: number; isActive?: boolean }>,
): PassportSummary {
  // Solo niveles activos, ordenados por minPoints
  const levels = rangosData
    .filter((r) => r.isActive !== false)
    .sort((a, b) => a.minPoints - b.minPoints)
    .map(mapLevelFromBackend);

  // Encontrar el nivel actual por categoryName
  const currentCategoryUpper = (scoreData.categoryName ?? '').toUpperCase();
  let currentLevelIndex = levels.findIndex(
    (l) => l.name.toUpperCase() === currentCategoryUpper || LEVEL_DISPLAY_NAMES[currentCategoryUpper] === l.name,
  );
  if (currentLevelIndex === -1) currentLevelIndex = 0;

  return {
    currentLevelIndex,
    points: scoreData.points ?? 0,
    levels,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLevelFromBackend(data: any): PassportLevel {
  const categoryUpper = (data.categoryName ?? data.category_name ?? '').toUpperCase();
  const displayName = LEVEL_DISPLAY_NAMES[categoryUpper] ?? data.categoryName ?? '';

  return {
    name: displayName,
    minPoints: data.minPoints ?? data.min_points ?? 0,
    maxPoints: data.maxPoints ?? data.max_points ?? null,
    maxLoanAmount: data.maxLoanAmount ?? data.max_loan_amount ?? 0,
    currency: data.currency ?? 'PEN',
    meta: {
      ...(LEVEL_META[categoryUpper] ?? DEFAULT_META),
      image: data.imageUrl || LEVEL_FALLBACK_IMAGE[categoryUpper] || '',
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHistoryEntryFromBackend(data: any): PointsHistoryEntry {
  // Backend types: REGISTRATION, PAYMENT, REFERRAL, PENALTY, etc.
  // Frontend types: EARNED | REDEEMED
  const backendType = (data.type ?? '').toUpperCase();
  const isRedeemed = backendType === 'PENALTY' || backendType === 'REDEEMED';

  return {
    id: data.id ?? '',
    description: data.reason ?? data.description ?? '',
    points: data.points ?? 0,
    date: data.created_at ?? data.createdAt ?? data.date ?? '',
    type: isRedeemed ? 'REDEEMED' : 'EARNED',
  };
}
