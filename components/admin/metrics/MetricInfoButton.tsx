'use client';

import { InfoPopover } from '@/components/admin/shared/InfoPopover';
import { METRIC_INFO, type MetricKey } from './metric-info';

/**
 * Icono "i" que abre un popover con la explicación de la métrica: qué representa
 * y cómo se calcula. Todo el texto vive en `metric-info.ts` — acá solo se
 * resuelve la clave y se delega el render a InfoPopover (compartido con otros
 * campos del admin, ej. la columna "Tasa" de /admin/credits).
 */
export function MetricInfoButton({ metricKey }: { metricKey: MetricKey }) {
  const info = METRIC_INFO[metricKey];
  if (!info) return null;

  return (
    <InfoPopover
      title={info.title}
      what={info.what}
      calculation={info.calculation}
      notes={info.notes}
    />
  );
}
