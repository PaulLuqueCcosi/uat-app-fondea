'use client';

import { useState, useCallback, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MoraCorrelation, MoraCorrelationBackend } from '@/modules/admin/education/education-analytics.types';

interface Props {
  /** yyyy-MM — el mismo mes elegido arriba para R51, usado acá SOLO si el admin activa el corte por mes. */
  month: string;
}

function mapResponse(raw: MoraCorrelationBackend): MoraCorrelation {
  return {
    accessedClientsTotal: raw.accessed_clients_total,
    accessedClientsInMora: raw.accessed_clients_in_mora,
    accessedMoraRatePercent: raw.accessed_mora_rate_percent,
    notAccessedClientsTotal: raw.not_accessed_clients_total,
    notAccessedClientsInMora: raw.not_accessed_clients_in_mora,
    notAccessedMoraRatePercent: raw.not_accessed_mora_rate_percent,
  };
}

/**
 * R52 — Correlación educación-mora. Por defecto acumulado (todo el histórico, sin mandar
 * `month`) — que es lo que pide la spec literal. El toggle "Hasta {mes}" acota el criterio de
 * "quién ya accedió" al mes elegido arriba en R51 (la mora que se muestra sigue siendo la
 * ACTUAL en ambos casos — ver metric-info.ts).
 */
export function EducationMoraCorrelationKpiCard({ month }: Props) {
  const [scoped, setScoped] = useState(false);
  const [data, setData] = useState<MoraCorrelation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (useMonth: boolean, selectedMonth: string) => {
    setLoading(true);
    try {
      const qs = useMonth ? `?month=${selectedMonth}` : '';
      const res = await fetch(`/api/admin/education/analytics/mora-correlation${qs}`);
      if (res.ok) setData(mapResponse(await res.json()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(scoped, month);
  }, [scoped, month, fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-[260px]" />;

  return (
    <MetricCard
      icon={ShieldAlert}
      title="Correlación educación - mora"
      metricKey="educationMoraCorrelation"
      description={scoped ? `Accedieron hasta ${month}` : 'Acumulado — todo el histórico'}
      onRefresh={() => fetchData(scoped, month)}
      isRefreshing={loading && !!data}
    >
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={scoped}
            onChange={(e) => setScoped(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300"
          />
          Acotar a &quot;ya accedió hasta {month}&quot; en vez de acumulado
        </label>

        {data ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">En mora</TableHead>
                <TableHead className="text-right">Tasa de mora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Accedieron a algún módulo</TableCell>
                <TableCell className="text-right">{data.accessedClientsTotal}</TableCell>
                <TableCell className="text-right">{data.accessedClientsInMora}</TableCell>
                <TableCell className="text-right font-bold">{data.accessedMoraRatePercent}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">No accedieron</TableCell>
                <TableCell className="text-right">{data.notAccessedClientsTotal}</TableCell>
                <TableCell className="text-right">{data.notAccessedClientsInMora}</TableCell>
                <TableCell className="text-right font-bold">{data.notAccessedMoraRatePercent}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
        )}
      </div>
    </MetricCard>
  );
}
