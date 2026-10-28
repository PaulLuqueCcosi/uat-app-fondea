import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PenaltyStage } from '@/modules/admin/admin-credit-detail.service';
import {
  daysText,
  daysUntilNextStage,
  stageDaysText,
  stageForDay,
  stageRuleLines,
} from '@/modules/shared/penalty-rule-text';

interface Props {
  stages: PenaltyStage[];
  /** Max days overdue of the credit; the stage that contains it is highlighted as the current one. */
  currentDays?: number;
}

/**
 * Penalty config of the credit as a vertical list: one row per stage with its day range and its rules
 * in plain language. Replaces the old stage x concept matrix, which got squeezed in the sidebar.
 */
export function PenaltyStageMatrix({ stages, currentDays = 0 }: Props) {
  const current = stageForDay(stages, currentDays);
  const untilNext = currentDays > 0 ? daysUntilNextStage(stages, currentDays) : null;

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const isCurrent = stage === current;
        const lines = stageRuleLines(stage.rules);
        return (
          <div
            key={i}
            className={cn('rounded-md border p-3', isCurrent && 'border-error-300 bg-error-50/50')}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {stage.color && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
              )}
              <span className="text-xs font-semibold">{stageDaysText(stage.fromDay, stage.toDay)}</span>
              {stage.label && <span className="text-xs text-muted-foreground">· {stage.label}</span>}
              {isCurrent && <Badge variant="destructive" className="text-[10px]">Tramo actual</Badge>}
            </div>
            {lines.length > 0 ? (
              <ul className="mt-1.5 space-y-0.5">
                {lines.map((line) => (
                  <li key={line} className="text-xs text-muted-foreground">{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">No se cobra nada en este tramo</p>
            )}
            {isCurrent && untilNext !== null && (
              <p className="mt-1.5 text-[11px] font-medium text-error-700">
                El siguiente tramo empieza en {daysText(untilNext)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
