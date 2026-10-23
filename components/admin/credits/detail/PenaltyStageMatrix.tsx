import {
  MATRIX_CONCEPTS,
  conceptLabel,
  methodLabel,
  ruleValueText,
} from '@/modules/shared/charge-concepts';
import type { PenaltyStage } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  stages: PenaltyStage[];
}

/** Matriz de la configuración POR_CONCEPTOS del crédito: un tramo por fila, un concepto por columna. */
export function PenaltyStageMatrix({ stages }: Props) {
  return (
    <div className="rounded-md border overflow-hidden overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tramo</th>
            {MATRIX_CONCEPTS.map((concept) => (
              <th key={concept} className="text-left py-2 px-3 font-medium text-muted-foreground">
                {conceptLabel(concept)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stages.map((stage, i) => (
            <tr key={i} className="border-t align-top">
              <td className="py-2 px-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  {stage.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />}
                  Día {stage.fromDay}{stage.toDay ? `–${stage.toDay}` : '+'}
                  {stage.label ? ` · ${stage.label}` : ''}
                </span>
              </td>
              {MATRIX_CONCEPTS.map((concept) => {
                const rule = stage.rules.find((r) => r.concept === concept);
                return (
                  <td key={concept} className="py-2 px-3">
                    {rule ? (
                      <>
                        <div>{methodLabel(rule.method)}</div>
                        <div className="font-mono">{ruleValueText(rule.method, rule.value)}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
