import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AdminCreditSummary, PenaltyBreakdownItem } from '@/modules/admin/admin-credit-detail.service';
import { PenaltyBreakdownTable } from './PenaltyBreakdownTable';
import { PenaltyStageMatrix } from './PenaltyStageMatrix';

interface Props {
  data: AdminCreditSummary;
  /** Mora del crédito por concepto (vista admin). */
  penaltyBreakdown: PenaltyBreakdownItem[];
  /** Días de atraso de la cuota más atrasada del crédito (0 si está al día). */
  maxDaysOverdue: number;
}

/** Mora del crédito: lo acumulado por concepto y la configuración (tramos) con la que se creó. */
export function CreditMoraTab({ data, penaltyBreakdown, maxDaysOverdue }: Props) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Mora por concepto</CardTitle>
          <p className="text-[11px] text-muted-foreground">Suma de las cuotas que este crédito cobra directamente.</p>
        </CardHeader>
        <CardContent>
          <PenaltyBreakdownTable items={penaltyBreakdown} />
        </CardContent>
      </Card>

      {data.penaltyConfig && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Configuración de mora del crédito
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Con la que se creó el crédito — queda fija aunque luego se actualice la configuración por defecto.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{data.penaltyConfig.name}</span>
              <Badge variant={data.penaltyConfig.isActive ? 'default' : 'outline'} className="text-[10px]">
                {data.penaltyConfig.isActive ? 'Sigue siendo la config. por defecto' : 'Ya no es la config. por defecto'}
              </Badge>
            </div>
            {data.penaltyConfig.stages.length > 0 && (
              <PenaltyStageMatrix stages={data.penaltyConfig.stages} currentDays={maxDaysOverdue} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
