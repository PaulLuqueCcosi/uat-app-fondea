'use client';

import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FormattedBlock } from '@/components/admin/shared/FormattedBlock';
import { METRIC_INFO, type MetricKey } from './metric-info';

/**
 * Icono "i" que abre un popover con la explicación de la métrica: qué representa
 * y cómo se calcula. Todo el texto vive en `metric-info.ts` — acá solo se
 * renderiza. Si el `metricKey` no existe en el catálogo, no muestra nada.
 */
export function MetricInfoButton({ metricKey }: { metricKey: MetricKey }) {
  const info = METRIC_INFO[metricKey];
  if (!info) return null;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Cómo se calcula: ${info.title}`}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="h-3.5 w-3.5" />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 max-h-[70vh] overflow-y-auto"
      >
        <div className="flex flex-col gap-3">
          {/* Título + qué es */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">{info.title}</p>
            <p className="text-xs text-muted-foreground">{info.what}</p>
          </div>

          {/* Cómo se calcula */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Cómo se calcula
            </p>
            <FormattedBlock text={info.calculation} />
          </div>

          {/* Notas */}
          {info.notes && (
            <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Notas
              </p>
              <FormattedBlock text={info.notes} muted />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
