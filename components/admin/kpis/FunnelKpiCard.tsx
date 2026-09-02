'use client';

import { useState, useCallback, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { FunnelKpi } from '@/modules/admin/admin-kpis.service';

type StageKey = 'intenciones' | 'enviadas' | 'aprobadas' | 'desembolsadas';

const ALL_STAGE_KEYS: StageKey[] = ['intenciones', 'enviadas', 'aprobadas', 'desembolsadas'];
/** Default: Intenciones arranca destildada (suele ser mucho más grande y aplasta el resto), las otras 3 visibles. */
const DEFAULT_VISIBLE_STAGES: StageKey[] = ['enviadas', 'aprobadas', 'desembolsadas'];

/**
 * KPI #9 — Funnel de conversión (mini). GET /api/v1/admin/dashboard-kpis/funnel
 *
 * 4 etapas, cada una una fuente distinta:
 *   new_intentions            = intenciones de usuario creadas (userintentions),
 *                               ANTES de KYC/formularios
 *   applications_submitted    = eventos SUBMITTED (funnel_metrics) — KYC +
 *                               formularios ya aprobados, requisito bloqueante del submit
 *   applications_pre_approved = eventos PRE_APPROVED — evaluación crediticia OK
 *   credits_disbursed         = eventos DISBURSED — crédito creado, dinero enviado
 * overall_conversion_rate = credits_disbursed / new_intentions × 100.
 *
 * Nota: NO hay etapa "KYC ok" separada a propósito — en este sistema el KYC
 * es requisito bloqueante ANTES de poder enviar la solicitud, así que
 * "Enviadas" ya lo implica. Agregar un número aparte para "KYC ok" sería
 * inventar una señal que no representa nada real (y tampoco se podría: la
 * tabla de eventos de funnel exige `application_id`, que no existe todavía
 * en el momento en que ocurre el KYC).
 *
 * El dominio interno tiene más etapas (VALIDATION_PASSED/FAILED, REJECTED,
 * CONTRACT_SIGNED, EXPIRED) pero este KPI solo expone 4 — es un funnel
 * "mini" a propósito, no el funnel completo (ese vive en userintentions,
 * GET /admin/calculator-intentions/funnel).
 *
 * Los checkboxes de etapas son SOLO de UI — el backend siempre trae las 4,
 * acá se ocultan/muestran en el cliente sin volver a pedir nada. El %
 * de cada etapa visible se recalcula sobre la primera etapa que sigue
 * tildada (no siempre "Intenciones"), para que el % de arriba del embudo
 * visible sea siempre 100%.
 */
export function FunnelKpiCard({ days: initialDays = 30 }: { days?: number }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<FunnelKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleStages, setVisibleStages] = useState<Set<StageKey>>(new Set(DEFAULT_VISIBLE_STAGES));

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kpis/funnel?days=${selectedDays}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  if (loading && !data) return <MetricCardSkeleton className="h-72" />;
  if (!data) return null;

  const allStages: { key: StageKey; label: string; value: number; color: string }[] = [
    { key: 'intenciones', label: 'Intenciones', value: data.new_intentions, color: '#00A1CD' },
    { key: 'enviadas', label: 'Enviadas', value: data.applications_submitted, color: '#0087AD' },
    { key: 'aprobadas', label: 'Aprobadas', value: data.applications_pre_approved, color: '#005F7A' },
    { key: 'desembolsadas', label: 'Desembolsadas', value: data.credits_disbursed, color: '#10b981' },
  ];

  const toggleStage = (key: StageKey, checked: boolean) => {
    const next = new Set(visibleStages);
    if (checked) next.add(key); else next.delete(key);
    setVisibleStages(next);
  };

  const stages = allStages.filter((s) => visibleStages.has(s.key));
  const base = stages[0]?.value ?? 0;

  const funnelData = stages.map((s) => {
    const pct = base > 0 ? Math.round((s.value * 100) / base) : 0;
    return {
      name: s.label,
      value: s.value,
      fill: s.color,
      pct,
      label: `${s.label} — ${s.value.toLocaleString()} (${pct}%)`,
    };
  });

  const submittedToApproved = data.applications_submitted > 0
    ? Math.round((data.applications_pre_approved * 100) / data.applications_submitted)
    : 0;
  const approvedToDisbursed = data.applications_pre_approved > 0
    ? Math.round((data.credits_disbursed * 100) / data.applications_pre_approved)
    : 0;

  return (
    <MetricCard
      icon={Filter}
      title="Funnel de Conversión"
      metricKey="funnel"
      description={`Conversión: ${data.overall_conversion_rate}%`}
      onRefresh={() => fetchData(days)}
      isRefreshing={loading && !!data}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground">
            <span className="mr-3">Enviadas → Aprobadas: {submittedToApproved}%</span>
            <span>Aprobadas → Desembolso: {approvedToDisbursed}%</span>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="14">14 días</SelectItem>
              <SelectItem value="20">20 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {allStages.map((s) => (
          <label key={s.key} className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
            <Checkbox
              checked={visibleStages.has(s.key)}
              onCheckedChange={(checked) => toggleStage(s.key, checked === true)}
            />
            {s.label}
          </label>
        ))}
      </div>

      {stages.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
          Selecciona al menos una etapa
        </div>
      ) : (
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 8, right: 8, bottom: 8, left: 170 }}>
            <Tooltip
              formatter={(value, _name, item) => {
                const payload = (item as { payload?: { pct?: number; name?: string } })?.payload;
                return [
                  `${Number(value).toLocaleString()} (${payload?.pct ?? 0}%)`,
                  payload?.name ?? '',
                ];
              }}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
              <LabelList
                position="left"
                dataKey="label"
                stroke="none"
                className="fill-foreground text-xs font-medium"
              />
              {funnelData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      )}
    </MetricCard>
  );
}
