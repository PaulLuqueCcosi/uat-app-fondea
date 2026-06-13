/**
 * Mapper: respuesta del backend → tipos del frontend.
 *
 * HOY: los datos mock ya vienen en formato correcto.
 * MAÑANA: cuando haya backend real, aquí se transformará snake_case → camelCase.
 *
 * Si el backend cambia un campo, SOLO se toca este archivo.
 */

import type { PassportSummary, PassportLevel, PointsHistoryEntry } from './passport.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSummaryFromBackend(data: any): PassportSummary {
  return {
    currentLevelIndex: data.current_level_index ?? data.currentLevelIndex ?? 0,
    points: data.points ?? 0,
    levels: (data.levels ?? []).map(mapLevelFromBackend),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLevelFromBackend(data: any): PassportLevel {
  return {
    name: data.name ?? '',
    minPoints: data.min_points ?? data.minPoints ?? 0,
    maxAmount: data.max_amount ?? data.maxAmount ?? 0,
    color: data.color ?? 'text-neutral-700',
    bgColor: data.bg_color ?? data.bgColor ?? 'bg-neutral-50',
    borderColor: data.border_color ?? data.borderColor ?? 'border-neutral-200',
    image: data.image ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapHistoryEntryFromBackend(data: any): PointsHistoryEntry {
  return {
    id: data.id ?? '',
    description: data.description ?? '',
    points: data.points ?? 0,
    date: data.date ?? data.created_at ?? '',
    type: data.type ?? 'EARNED',
  };
}
