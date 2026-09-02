'use client';

import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FormattedBlock } from '@/components/admin/shared/FormattedBlock';

export interface InfoPopoverContent {
  title: string;
  what: string;
  calculation: string;
  notes?: string;
}

/**
 * Icono "i" que abre un popover con título, qué es y cómo se calcula. Patrón
 * compartido por cualquier campo del admin que necesite explicar su cálculo
 * (KPIs de dashboard vía MetricInfoButton, columnas de tablas, etc.) — antes
 * vivía duplicado dentro de MetricInfoButton.
 */
export function InfoPopover({ title, what, calculation, notes }: InfoPopoverContent) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Cómo se calcula: ${title}`}
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
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{what}</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Cómo se calcula
            </p>
            <FormattedBlock text={calculation} />
          </div>

          {notes && (
            <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Notas
              </p>
              <FormattedBlock text={notes} muted />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
