'use client';

import { MATRIX_CONCEPTS, conceptLabel } from '@/modules/shared/charge-concepts';
import type { ConceptsCatalog, PenaltyStage } from '@/modules/admin/admin-penalty.types';
import { formatDayRange, getLucideIcon } from './penalty-style-options';
import { ruleSummary } from './penalty-matrix';

interface Props {
  stages: PenaltyStage[];
  catalog: ConceptsCatalog | null;
  /** Vista compacta para el historial. */
  compact?: boolean;
}

/** Tabla de solo lectura: una fila por tramo, una columna por concepto. */
export function PenaltyStagesTable({ stages, catalog, compact = false }: Props) {
  if (stages.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta configuración no tiene tramos.</p>;
  }

  const textSize = compact ? 'text-[11px]' : 'text-xs';

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className={`w-full min-w-[640px] ${textSize}`}>
        <caption className="sr-only">Mora por tramo y por concepto</caption>
        <thead className="bg-muted/40 text-left">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Tramo</th>
            {MATRIX_CONCEPTS.map((concept) => (
              <th key={concept} scope="col" className="px-3 py-2 font-medium">
                {conceptLabel(concept, catalog?.concepts.find((c) => c.code === concept)?.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stages.map((stage, i) => {
            const IconComp = stage.icon ? getLucideIcon(stage.icon) : null;
            return (
              <tr key={stage.id ?? i} className="border-t align-top">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <div className="flex items-center gap-2">
                    {stage.color && (
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border"
                        style={{ backgroundColor: stage.color }}
                        aria-hidden="true"
                      />
                    )}
                    {IconComp && <IconComp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <div>
                      <p className="font-medium text-foreground">{stage.label || `Tramo ${i + 1}`}</p>
                      <p className="text-muted-foreground">{formatDayRange(stage.fromDay, stage.toDay)}</p>
                    </div>
                  </div>
                </th>
                {MATRIX_CONCEPTS.map((concept) => {
                  const rule = stage.rules.find((r) => r.concept === concept);
                  return (
                    <td
                      key={concept}
                      className={`px-3 py-2 ${rule ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {ruleSummary(rule, catalog)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
