'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { Checkbox } from '@/components/ui/checkbox';
import type { NplKpi } from '@/modules/admin/admin-kpis.service';

interface NplKpiCardProps {
  /** Plazos (días) realmente configurados para el producto — GET /api/products/{id}/options. */
  termDaysOptions: number[];
}

const money = (v: number) => `S/ ${v.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;

/**
 * KPI #4 — NPL general + por plazo, ambos en soles.
 * GET /api/v1/admin/dashboard-kpis/npl?termDays=7,15,30
 *
 * general_rate = overdue_capital / active_capital × 100.
 *   active_capital  = SUM(principal) de créditos STANDARD, status IN (ACTIVE, OVERDUE).
 *   overdue_capital = SUM(principal) de créditos STANDARD, status = OVERDUE.
 *   (créditos de NEGOCIACIÓN excluidos — mismo criterio que KPI #1).
 *
 * by_term_days[].npl_rate = overdue_principal / total_principal × 100, PERO
 * calculado por separado para CADA plazo (termDays) pedido — mismo criterio que
 * el general, restringido a los créditos de ese plazo puntual. Los plazos que se
 * piden pero no tienen créditos en la BD igual aparecen, con 0/0 = 0%.
 * `termDaysOptions` (los que se pueden tildar) vienen del catálogo REAL del
 * producto en fondea-calculator-service, no están hardcodeados acá.
 *
 * Caso de uso INDEPENDIENTE de KPI #5 (tramos de mora, ver NplTranchesKpiCard) —
 * no comparten fórmula ni endpoint, aunque las dos hablen de "mora".
 */
export function NplKpiCard({ termDaysOptions }: NplKpiCardProps) {
  const [selectedTermDays, setSelectedTermDays] = useState<number[]>(termDaysOptions);
  const [npl, setNpl] = useState<NplKpi | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNpl = useCallback(async (days: number[]) => {
    setLoading(true);
    try {
      const query = days.length > 0 ? `?termDays=${days.join(',')}` : '';
      const res = await fetch(`/api/admin/kpis/npl${query}`);
      if (res.ok) setNpl(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNpl(selectedTermDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTermDay = (days: number, checked: boolean) => {
    const next = checked
      ? [...selectedTermDays, days].sort((a, b) => a - b)
      : selectedTermDays.filter((d) => d !== days);
    setSelectedTermDays(next);
    fetchNpl(next);
  };

  if (loading && !npl) return <MetricCardSkeleton />;
  if (!npl) return null;

  const termDaysData = npl.by_term_days.map((td) => ({
    term: `${td.term_days}d`,
    rate: td.npl_rate,
  }));

  return (
    <MetricCard
      icon={AlertTriangle}
      title="Tasa de Mora (NPL)"
      description={`${money(npl.overdue_capital)} / ${money(npl.active_capital)}`}
      onRefresh={() => fetchNpl(selectedTermDays)}
      isRefreshing={loading}
    >
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-bold">{npl.general_rate}%</span>
        <span className="text-sm text-muted-foreground">NPL general</span>
      </div>

      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs text-muted-foreground shrink-0 pt-0.5">Por plazo</p>
        {termDaysOptions.length > 0 && (
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 min-w-0">
            {termDaysOptions.map((days) => (
              <label key={days} className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
                <Checkbox
                  checked={selectedTermDays.includes(days)}
                  onCheckedChange={(checked) => toggleTermDay(days, checked === true)}
                />
                {days}d
              </label>
            ))}
          </div>
        )}
      </div>

      {termDaysData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
          Selecciona al menos un plazo
        </div>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={termDaysData}>
              <XAxis dataKey="term" tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [`${Number(value)}%`, 'NPL']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="rate" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-2">
        {npl.by_term_days.map((td) => (
          <span key={td.term_days} className="text-[10px] text-muted-foreground">
            {td.term_days}d: {money(td.overdue_principal)} / {money(td.total_principal)}
          </span>
        ))}
      </div>
    </MetricCard>
  );
}
