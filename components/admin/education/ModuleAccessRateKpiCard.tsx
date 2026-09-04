'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { ModuleAccessRate, ModuleAccessRateBackend } from '@/modules/admin/education/education-analytics.types';

const COLOR_ACCESSED = '#00A1CD';
const COLOR_NOT_ACCESSED = '#E5E7EB';

interface Props {
  /** yyyy-MM */
  month: string;
}

function mapEntry(raw: ModuleAccessRateBackend): ModuleAccessRate {
  return {
    moduleId: raw.module_id,
    moduleOrder: raw.module_order,
    moduleTitle: raw.module_title,
    accessedCount: raw.accessed_count,
    activeClientsTotal: raw.active_clients_total,
    accessRatePercent: raw.access_rate_percent,
  };
}

/** R51 — Tasa de acceso a módulos, por mes. Un módulo a la vez (selector), dona por módulo. */
export function ModuleAccessRateKpiCard({ month }: Props) {
  const [entries, setEntries] = useState<ModuleAccessRate[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (selectedMonth: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/education/analytics/module-access-rate?month=${selectedMonth}`);
      if (res.ok) {
        const raw: ModuleAccessRateBackend[] = await res.json();
        const mapped = raw.map(mapEntry).sort((a, b) => a.moduleOrder - b.moduleOrder);
        setEntries(mapped);
        setSelectedModuleId((prev) => (mapped.some((m) => m.moduleId === prev) ? prev : mapped[0]?.moduleId ?? ''));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(month);
  }, [month, fetchData]);

  const selected = useMemo(
    () => entries.find((e) => e.moduleId === selectedModuleId) ?? null,
    [entries, selectedModuleId]
  );

  if (loading && entries.length === 0) return <MetricCardSkeleton className="h-[360px]" />;

  const chartData = selected
    ? [
        { name: 'Accedieron', value: selected.accessedCount },
        { name: 'No accedieron', value: Math.max(0, selected.activeClientsTotal - selected.accessedCount) },
      ]
    : [];

  return (
    <MetricCard
      icon={GraduationCap}
      title="Tasa de acceso a módulos"
      metricKey="educationAccessRate"
      onRefresh={() => fetchData(month)}
      isRefreshing={loading && entries.length > 0}
    >
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin datos para este mes</p>
      ) : (
        <div className="space-y-4">
          <Select value={selectedModuleId} onValueChange={(v) => v && setSelectedModuleId(v)}>
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entries.map((e) => (
                <SelectItem key={e.moduleId} value={e.moduleId}>
                  Módulo {e.moduleOrder} — {e.moduleTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selected && (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    <Cell fill={COLOR_ACCESSED} />
                    <Cell fill={COLOR_NOT_ACCESSED} />
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} clientes`, '']} />
                </PieChart>
              </ResponsiveContainer>

              <p className="text-sm text-center text-foreground">
                <span className="font-bold text-primary">{selected.accessRatePercent}%</span>
                {' = '}
                <span className="font-medium">{selected.accessedCount}</span>
                {' de '}
                <span className="font-medium">{selected.activeClientsTotal}</span>
                {' clientes activos accedieron al Módulo '}
                {selected.moduleOrder}.
              </p>
            </>
          )}
        </div>
      )}
    </MetricCard>
  );
}
