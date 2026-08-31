'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { ScanFace, ListTree, XCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type {
  KycFirstAttempt, KycFirstAttemptBackend,
  FormStepEntry, FormStepEntryBackend,
  RejectionBreakdown, RejectionBreakdownBackend,
  LeadsByHourEntry, LeadsByHourBackend,
} from '@/modules/admin/admin-marketing.types';

// ── Fetch helper ──────────────────────────────────────────────────────────────

const BASE = '/api/admin/marketing/analytics';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function toDateParams(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

// ── Colores ───────────────────────────────────────────────────────────────────

function getRateColor(rate: number, targetHigh: number): string {
  if (rate >= targetHigh) return 'text-emerald-700';
  if (rate >= targetHigh - 20) return 'text-amber-700';
  return 'text-red-700';
}

// ── Componente principal ──────────────────────────────────────────────────────

export function MarketingAnalyticsTab() {
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycFirstAttempt | null>(null);
  const [steps, setSteps] = useState<FormStepEntry[]>([]);
  const [rejections, setRejections] = useState<RejectionBreakdown | null>(null);
  const [leadsByHour, setLeadsByHour] = useState<LeadsByHourEntry[]>([]);

  const fetchAll = useCallback(async (selectedDays: string) => {
    setLoading(true);
    const { from, to } = toDateParams(Number(selectedDays));
    const qs = `from=${from}&to=${to}`;

    const [kycRaw, stepsRaw, rejectionsRaw, leadsRaw] = await Promise.all([
      fetchJson<KycFirstAttemptBackend>(`kyc-first-attempt?${qs}`),
      fetchJson<{ steps: FormStepEntryBackend[] }>(`form-step-abandonment?${qs}`),
      fetchJson<RejectionBreakdownBackend>(`rejection-breakdown?${qs}`),
      fetchJson<LeadsByHourBackend>(`leads-by-hour?${qs}`),
    ]);

    setKyc(kycRaw ? {
      totalAttempts: kycRaw.total_attempts,
      firstAttemptSuccess: kycRaw.first_attempt_success,
      successRate: kycRaw.success_rate,
      targetRate: kycRaw.target_rate,
    } : null);

    setSteps((stepsRaw?.steps ?? []).map((s) => ({
      step: s.step,
      label: s.label,
      count: s.count,
      abandonmentRate: s.abandonment_rate,
    })));

    setRejections(rejectionsRaw ? {
      totalRejections: rejectionsRaw.total_rejections,
      reasons: rejectionsRaw.reasons,
    } : null);

    setLeadsByHour(leadsRaw?.hours ?? []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll(days);
  }, [days, fetchAll]);

  if (loading && !kyc) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCardSkeleton className="h-[200px]" />
        <MetricCardSkeleton className="h-[200px]" />
        <MetricCardSkeleton className="h-[350px] lg:col-span-2" />
        <MetricCardSkeleton className="h-[300px] lg:col-span-2" />
      </div>
    );
  }

  const topRejections = (rejections?.reasons ?? []).slice(0, 15);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Select value={days} onValueChange={(v) => setDays(v ?? '30')}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="14">Últimos 14 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* R37 — KYC primer intento */}
        <MetricCard
          icon={ScanFace}
          title="Tasa de éxito del KYC (R37)"
          description="% aprobado a la primera, sin reintento — objetivo ≥ 80%"
          onRefresh={() => fetchAll(days)}
          isRefreshing={loading}
        >
          {kyc ? (
            <div className="flex items-center gap-6">
              <p className={`text-4xl font-bold ${getRateColor(kyc.successRate, kyc.targetRate)}`}>
                {kyc.successRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {kyc.firstAttemptSuccess} de {kyc.totalAttempts} intentos<br />
                Objetivo: {kyc.targetRate}%
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
          )}
        </MetricCard>

        {/* R39 — Rechazos por motivo */}
        <MetricCard
          icon={XCircle}
          title="Rechazos por motivo (R39)"
          description={`${rejections?.totalRejections ?? 0} solicitudes rechazadas — texto libre, no categorías fijas`}
          onRefresh={() => fetchAll(days)}
          isRefreshing={loading}
        >
          {topRejections.length ? (
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {topRejections.map((r, i) => (
                <div key={`${r.reason}-${i}`} className="flex items-center justify-between gap-2 py-1 border-b last:border-0">
                  <span className="text-xs truncate flex-1" title={r.reason}>{r.reason}</span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{r.count} ({r.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin rechazos en el período</p>
          )}
        </MetricCard>
      </div>

      {/* R38 — Abandono por paso */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListTree className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Abandono por paso del formulario (R38)</CardTitle>
              <CardDescription className="text-[11px]">
                % de abandono de cada paso respecto a la intención inicial
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {steps.length ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={steps} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, 'Abandono'] as [string, string]}
                />
                <Bar dataKey="abandonmentRate" radius={[0, 4, 4, 0]}>
                  {steps.map((s, i) => (
                    <Cell key={i} fill={s.abandonmentRate == null ? '#94A3B8' : '#00A1CD'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* R41 — Leads por hora */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Leads por hora (R41)</CardTitle>
              <CardDescription className="text-[11px]">Inicios de formulario por hora del día — hora local Lima</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leadsByHour.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={leadsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} leads`, '']} labelFormatter={(h) => `${h}:00 - ${h}:59`} />
                <Bar dataKey="count" fill="#00A1CD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
