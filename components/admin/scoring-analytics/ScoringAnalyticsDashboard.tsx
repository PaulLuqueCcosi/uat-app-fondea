'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { CheckCircle2, Gauge, Server } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import type {
  ApprovalRate, ApprovalRateBackend,
  NplByScoreBand, NplByScoreBandBackend,
  ApiUsage, ApiUsageBackend,
} from '@/modules/admin/scoring/scoring-analytics.types';

// ── Fetch helper ──────────────────────────────────────────────────────────────

const BASE = '/api/admin/scoring/analytics';

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

const API_LABELS: Record<string, string> = {
  SENTINEL: 'Sentinel (buró)',
  RENIEC: 'RENIEC (validación DNI)',
  REKOGNITION: 'Rekognition (selfie)',
};

function getNplBandColor(rate: number): string {
  if (rate <= 5) return '#059669';
  if (rate <= 9) return '#D97706';
  return '#DC2626';
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ScoringAnalyticsDashboard() {
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [approval, setApproval] = useState<ApprovalRate | null>(null);
  const [nplBands, setNplBands] = useState<NplByScoreBand | null>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsage | null>(null);

  const fetchAll = useCallback(async (selectedDays: string) => {
    setLoading(true);
    const { from, to } = toDateParams(Number(selectedDays));
    const qs = `from=${from}&to=${to}`;

    const [approvalRaw, nplRaw, apiRaw] = await Promise.all([
      fetchJson<ApprovalRateBackend>(`approval-rate?${qs}&trendMonths=12`),
      fetchJson<NplByScoreBandBackend>('npl-by-score-band'),
      fetchJson<ApiUsageBackend>(`api-usage?${qs}`),
    ]);

    setApproval(approvalRaw ? {
      totalApplications: approvalRaw.total_applications,
      approvedApplications: approvalRaw.approved_applications,
      approvalRate: approvalRaw.approval_rate,
      trend: approvalRaw.trend,
    } : null);

    setNplBands(nplRaw ? {
      bands: nplRaw.bands.map((b) => ({
        band: b.band,
        activeLoans: b.active_loans,
        overdueLoans: b.overdue_loans,
        nplRate: b.npl_rate,
      })),
    } : null);

    setApiUsage(apiRaw ? {
      apis: apiRaw.apis.map((a) => ({ api: a.api, queryCount: a.query_count })),
    } : null);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll(days);
  }, [days, fetchAll]);

  if (loading && !approval) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCardSkeleton className="h-[350px] lg:col-span-2" />
        <MetricCardSkeleton className="h-[300px] lg:col-span-2" />
        <MetricCardSkeleton className="h-[200px] lg:col-span-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Select value={days} onValueChange={(v) => setDays(v ?? '30')}>
          <SelectTrigger className="h-8 w-52 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días (tasa aprobación / APIs)</SelectItem>
            <SelectItem value="14">Últimos 14 días (tasa aprobación / APIs)</SelectItem>
            <SelectItem value="30">Últimos 30 días (tasa aprobación / APIs)</SelectItem>
            <SelectItem value="90">Últimos 90 días (tasa aprobación / APIs)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* R42 — Tasa de aprobación + tendencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Tasa de aprobación (R42)</CardTitle>
              <CardDescription className="text-[11px]">
                Tendencia de 12 meses — no depende del selector de período
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {approval ? (
            <>
              <div className="flex items-center gap-6">
                <p className="text-4xl font-bold text-primary">{approval.approvalRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {approval.approvedApplications} de {approval.totalApplications} solicitudes<br />
                  aprobadas en el período seleccionado
                </p>
              </div>
              {approval.trend.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={approval.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, 'Aprobación']} labelFormatter={(l) => `Mes: ${l}`} />
                    <Line type="monotone" dataKey="rate" stroke="#00A1CD" strokeWidth={2} dot={{ r: 3, fill: '#00A1CD' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* R43 — NPL por banda de score */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Mora por banda de score (R43)</CardTitle>
              <CardDescription className="text-[11px]">
                Cartera activa completa (0-1000) — la mora debería bajar al subir de banda
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {nplBands?.bands?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={nplBands.bands}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, 'NPL']}
                  labelFormatter={(band) => `Banda ${band}`}
                />
                <Bar dataKey="nplRate" radius={[4, 4, 0, 0]}>
                  {nplBands.bands.map((b, i) => (
                    <Cell key={i} fill={getNplBandColor(b.nplRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          )}
          {nplBands?.bands?.length ? (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {nplBands.bands.map((b) => (
                <div key={b.band} className="text-center border rounded-md py-2">
                  <p className="text-[10px] text-muted-foreground">{b.band}</p>
                  <p className="text-[10px] text-muted-foreground">{b.overdueLoans}/{b.activeLoans}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* R44 — Consultas por API */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Consultas por API (R44)</p>
            <p className="text-[11px] text-muted-foreground">
              Solo cantidad — sin costo en S/, no hay integración de billing con los proveedores
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(apiUsage?.apis ?? []).map((a) => (
            <Card key={a.api}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{a.queryCount}</p>
                <p className="text-xs text-muted-foreground mt-1">{API_LABELS[a.api] ?? a.api}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">consultas</p>
              </CardContent>
            </Card>
          ))}
          {!apiUsage?.apis?.length && (
            <p className="text-sm text-muted-foreground text-center py-6 col-span-3">Sin datos</p>
          )}
        </div>
      </div>
    </div>
  );
}
