'use client';

import { useState, useCallback, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { NplTranchesKpi, MoraStage } from '@/modules/admin/admin-kpis.service';

/** Semáforo de 7 etapas: de atraso mínimo (lima) a ya castigable (casi negro). */
const STAGE_COLORS: Record<string, string> = {
  MORA_TEMPRANA_A: '#a3e635',
  MORA_TEMPRANA_B: '#eab308',
  COBRANZA_ACTIVA_TEMPRANA: '#f59e0b',
  COBRANZA_ACTIVA_INTERMEDIA: '#f97316',
  COBRANZA_TARDIA: '#ef4444',
  PRECASTIGO: '#b91c1c',
  CASTIGO: '#450a0a',
};

const money = (v: number) => `S/ ${v.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;

/** "1-4d" o "91d+" si no tiene límite superior (Castigo). */
const dayRange = (stage: MoraStage) =>
  stage.max_days != null ? `${stage.min_days}-${stage.max_days}d` : `${stage.min_days}d+`;

type ChartRow = {
  key: string;
  label: string;
  range: string;
  percentage: number;
  count: number;
  amount: number;
  fill: string;
};

/** Eje Y de 2 líneas: nombre de la etapa arriba, rango de días abajo — sin esto
 * los días de cada etapa no se veían en ningún lado de la UI, solo en el código. */
function StageAxisTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x = 0, y = 0, payload } = props;
  if (!payload) return null;
  const [label, range] = payload.value.split('\n');
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={-3} textAnchor="end" fontSize={10} fill="currentColor">
        {label}
      </text>
      <text x={0} y={10} textAnchor="end" fontSize={9} fill="hsl(var(--muted-foreground))">
        {range}
      </text>
    </g>
  );
}

/**
 * KPI #5 — NPL por etapa de cobranza, a nivel de CUOTA (no de préstamo).
 * GET /api/v1/admin/dashboard-kpis/npl/tranches
 *
 * Denominador = total_overdue_installments = COUNT de TODAS las cuotas con
 * status=OVERDUE, de créditos STANDARD con status IN (ACTIVE, OVERDUE)
 * (excluye créditos ya castigados/suspendidos y créditos de NEGOCIACIÓN).
 * Cada cuota vencida cae en EXACTAMENTE una de las 7 etapas, según su propio
 * `daysOverdue` (nunca dos a la vez, a diferencia del diseño original D+1-30
 * del brief, que sí permitía que un préstamo con cuotas en 2 rangos distintos
 * se contara dos veces):
 *   1-4d Mora temprana A · 5-8d Mora temprana B · 9-15d Cobranza activa temprana
 *   16-30d Cobranza activa intermedia · 31-60d Cobranza tardía · 61-90d Precastigo
 *   91d+ Castigo (sin límite superior)
 * stages[].percentage = installment_count de esa etapa / total_overdue_installments × 100
 * — las 7 etapas SIEMPRE suman 100% entre sí (no está atado al NPL general del
 * KPI #4, son métricas independientes a propósito, con dos denominadores distintos).
 * stages[].installment_amount = SUM(amount_due - amount_paid) de esas cuotas — el
 * monto REAL pendiente de esa cuota puntual, NO el principal del crédito completo.
 *
 * Barras horizontales independientes (layout="vertical" en términos de recharts),
 * NO una sola barra apilada — cada barra es directamente comparable en longitud.
 */
export function NplTranchesKpiCard() {
  const [data, setData] = useState<NplTranchesKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/npl-tranches');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  const chartData: ChartRow[] = data.stages.map((stage) => ({
    key: stage.stage_key,
    label: stage.label,
    range: dayRange(stage),
    // El tick custom parte este string por "\n" — dataKey del YAxis necesita un
    // valor único de texto por fila, no un objeto, para que recharts lo matchee.
    percentage: stage.percentage,
    count: stage.installment_count,
    amount: stage.installment_amount,
    fill: STAGE_COLORS[stage.stage_key] ?? '#6b7280',
  }));

  return (
    <MetricCard
      icon={ShieldAlert}
      title="NPL por Etapa de Cobranza"
      metricKey="nplTranches"
      description={`${data.total_overdue_installments} cuotas en mora — ${money(data.total_overdue_amount)}`}
      onRefresh={fetchData}
      isRefreshing={loading}
    >
      <p className="text-[11px] text-muted-foreground mb-2">
        % de cuotas vencidas en cada etapa, según cuántos días lleva atrasada cada
        una — las 7 barras suman 100% del total de cuotas en mora.
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey={(row: ChartRow) => `${row.label}\n${row.range}`}
              width={150}
              interval={0}
              tick={<StageAxisTick />}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, _name, item) => {
                const row = item.payload as ChartRow;
                return [`${Number(value)}% (${row.count} cuotas — ${money(row.amount)})`, `${row.label} (${row.range})`];
              }}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((d) => (
                <Cell key={d.key} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {chartData.map((d) => (
          <span key={d.key} className="text-[10px] text-muted-foreground">
            {d.label} ({d.range}): {d.count} cuotas — {money(d.amount)}
          </span>
        ))}
      </div>
    </MetricCard>
  );
}
