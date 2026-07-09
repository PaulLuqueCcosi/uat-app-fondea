/**
 * Service de Transparencia — consecuencias de mora por producto.
 *
 * Lee la configuración de penalidad activa del backend y la transforma
 * al formato que espera el TransparencyCard.
 */

import { backendFetch } from '@/lib/backend-fetch';
import type { Result } from '@/modules/shared/result';
import type { TransparencyConfig, TransparencyScenario, ScenarioSeverity } from './transparency.types';
import { errors } from './passport.errors';

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Obtiene la configuración de transparencia desde el backend.
 * Llama al endpoint público /api/v1/penalty-config y transforma los rangos.
 */
export async function getTransparencyConfig(
  _productId?: string,
): Promise<Result<TransparencyConfig>> {
  try {
    const res = await backendFetch('/api/v1/penalty-config', {
      context: 'TRANSPARENCY',
    });

    // Si no hay config activa, devolver config mínima con solo pago puntual
    if (res.status === 204 || !res.ok) {
      return {
        ok: true,
        data: {
          productId: 'default',
          currency: 'PEN',
          scenarios: [createOnTimeScenario()],
          tip: 'Pagar a tiempo te da puntos para subir de nivel y desbloquear mejores montos de crédito.',
        },
      };
    }

    const penaltyConfig = await res.json();
    const config = mapPenaltyConfigToTransparency(penaltyConfig);
    return { ok: true, data: config };
  } catch (err) {
    console.error('[TRANSPARENCY] getTransparencyConfig → error:', err);
    return { ok: false, error: errors.networkError() };
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapPenaltyConfigToTransparency(penaltyConfig: any): TransparencyConfig {
  const scenarios: TransparencyScenario[] = [];

  // Primer escenario: Pago puntual (siempre)
  scenarios.push(createOnTimeScenario());

  // Rangos de mora del backend
  if (penaltyConfig.ranges && Array.isArray(penaltyConfig.ranges)) {
    for (const range of penaltyConfig.ranges) {
      scenarios.push({
        id: range.id ?? `range-${range.fromDay}-${range.toDay ?? 'plus'}`,
        fromDay: range.fromDay,
        toDay: range.toDay,
        title: range.label || formatRangeTitle(range.fromDay, range.toDay),
        description: formatRangeDescription(range),
        severity: mapColorToSeverity(range.color),
        penaltyPerDay: range.type === 'FIXED' ? range.value : null,
        // Campos extra para el frontend
        icon: range.icon ?? null,
        color: range.color ?? null,
        type: range.type,
        value: range.value,
        base: range.base,
      } as any);
    }
  }

  return {
    productId: 'default',
    currency: 'PEN',
    scenarios,
    tip: 'Pagar a tiempo te da puntos para subir de nivel y desbloquear mejores montos de crédito.',
  };
}

function createOnTimeScenario(): TransparencyScenario {
  return {
    id: 'on-time',
    fromDay: 0,
    toDay: 0,
    title: 'Pago puntual',
    description: '+15 puntos en tu pasaporte',
    severity: 'positive',
    penaltyPerDay: null,
  };
}

function formatRangeTitle(from: number, to: number | null): string {
  if (to === null) return `${from}+ días`;
  if (from === to) return `Día ${from}`;
  return `${from} a ${to} días`;
}

function formatRangeDescription(range: any): string {
  if (range.type === 'FIXED') {
    return `Penalidad de S/ ${range.value} por día`;
  }
  const baseLabel = range.base === 'PRINCIPAL' ? 'del préstamo' : 'de la cuota';
  return `${range.value}% ${baseLabel} por día`;
}

function mapColorToSeverity(color: string | null): ScenarioSeverity {
  if (!color) return 'low';
  // Mapear colores hex a severidades
  const c = color.toLowerCase();
  if (c.includes('10b981') || c === '#10b981') return 'positive'; // verde
  if (c.includes('f59e0b') || c === '#f59e0b') return 'low'; // amarillo
  if (c.includes('f97316') || c === '#f97316') return 'medium'; // naranja
  if (c.includes('ef4444') || c === '#ef4444') return 'high'; // rojo
  if (c.includes('8b5cf6') || c === '#8b5cf6') return 'critical'; // morado
  if (c.includes('3b82f6') || c === '#3b82f6') return 'low'; // azul
  // Fallback por nombre semántico (si alguien puso nombres)
  if (c === 'success' || c === 'green') return 'positive';
  if (c === 'warning' || c === 'yellow') return 'low';
  if (c === 'error' || c === 'red') return 'high';
  return 'medium';
}
