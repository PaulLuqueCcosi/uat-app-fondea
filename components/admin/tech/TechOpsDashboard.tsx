'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import { AlertTriangle, ScanFace, Wallet, Radio, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
} from 'recharts';
import type {
  KycProcessingTime, KycProcessingTimeBackend,
  ApiStatus, ApiStatusBackend, ApiHealthStatus,
  DisbursementTime, DisbursementTimeBackend,
} from '@/modules/admin/tech/tech-analytics.types';

// ── Umbrales de alerta (del brief) ────────────────────────────────────────────

const KYC_ALERT_SECONDS = 180; // >3 min
const KYC_ALERT_TARGET_SECONDS = 60; // objetivo <60s
const KYC_CONSECUTIVE_COUNT = 3;
const DISBURSEMENT_ALERT_MINUTES = 15;
const DISBURSEMENT_TARGET_MINUTES = 10;

const API_LABELS: Record<string, string> = {
  SENTINEL: 'Sentinel (buró)',
  RENIEC: 'RENIEC (validación DNI)',
  REKOGNITION: 'Rekognition (selfie)',
};

// ── Fetch helpers ──────────────────────────────────────────────────────────────

const BASE = '/api/admin/tech/analytics';

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

function statusBadge(status: ApiHealthStatus) {
  switch (status) {
    case 'OK':
      return { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700', label: 'OK' };
    case 'ERROR':
      return { icon: XCircle, cls: 'bg-red-50 text-red-700', label: 'ERROR' };
    default:
      return { icon: HelpCircle, cls: 'bg-gray-100 text-gray-600', label: 'Sin datos' };
  }
}

function findConsecutiveKycBreaches(applications: KycProcessingTime['applications']): number {
  // El backend ordena desc por lastAttemptAt — se invierte a asc para evaluar "consecutivas" en el tiempo.
  const asc = [...applications].sort((a, b) => a.lastAttemptAt.localeCompare(b.lastAttemptAt));
  let streak = 0;
  let maxStreak = 0;
  for (const app of asc) {
    if (app.totalProcessingSeconds > KYC_ALERT_SECONDS) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }
  return maxStreak;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function TechOpsDashboard() {
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycProcessingTime | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [disbursement, setDisbursement] = useState<DisbursementTime | null>(null);

  const fetchPeriodData = useCallback(async (selectedDays: string) => {
    setLoading(true);
    const { from, to } = toDateParams(Number(selectedDays));
    const qs = `from=${from}&to=${to}`;

    const [kycRaw, disbursementRaw] = await Promise.all([
      fetchJson<KycProcessingTimeBackend>(`kyc-processing-time?${qs}`),
      fetchJson<DisbursementTimeBackend>(`disbursement-time?${qs}`),
    ]);

    setKyc(kycRaw ? {
      periodAvgSeconds: kycRaw.period_avg_seconds,
      periodMaxSeconds: kycRaw.period_max_seconds,
      applications: kycRaw.applications.map((a) => ({
        applicationId: a.application_id,
        totalProcessingSeconds: a.total_processing_seconds,
        lastAttemptAt: a.last_attempt_at,
      })),
    } : null);

    setDisbursement(disbursementRaw ? {
      periodAvgMinutes: disbursementRaw.period_avg_minutes,
      periodMaxMinutes: disbursementRaw.period_max_minutes,
      credits: disbursementRaw.credits.map((c) => ({
        creditId: c.credit_id,
        signedAt: c.signed_at,
        disbursedAt: c.disbursed_at,
        minutesElapsed: c.minutes_elapsed,
      })),
    } : null);

    setLoading(false);
  }, []);

  const fetchApiStatus = useCallback(async () => {
    const raw = await fetchJson<ApiStatusBackend>('api-status');
    setApiStatus(raw ? {
      apis: raw.apis.map((a) => ({ api: a.api, status: a.status, lastCheckedAt: a.last_checked_at })),
    } : null);
  }, []);

  useEffect(() => {
    fetchPeriodData(days);
  }, [days, fetchPeriodData]);

  // R46 es el único sin período — se refresca solo cada 30s, tiene más sentido que en R45/R48.
  useEffect(() => {
    fetchApiStatus();
    const interval = setInterval(fetchApiStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchApiStatus]);

  const kycConsecutiveBreaches = useMemo(
    () => (kyc ? findConsecutiveKycBreaches(kyc.applications) : 0),
    [kyc]
  );
  const kycAlertActive = kycConsecutiveBreaches >= KYC_CONSECUTIVE_COUNT;

  const disbursementBreach = useMemo(
    () => disbursement?.credits.find((c) => c.minutesElapsed > DISBURSEMENT_ALERT_MINUTES) ?? null,
    [disbursement]
  );
  const disbursementAlertActive = disbursementBreach != null;

  const apiErrors = useMemo(
    () => (apiStatus?.apis ?? []).filter((a) => a.status === 'ERROR'),
    [apiStatus]
  );
  const apiAlertActive = apiErrors.length > 0;

  const anyAlertActive = kycAlertActive || disbursementAlertActive || apiAlertActive;

  if (loading && !kyc) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCardSkeleton className="h-[300px] lg:col-span-2" />
        <MetricCardSkeleton className="h-[200px]" />
        <MetricCardSkeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de alertas activas — el motivo de ser de esta sección */}
      {anyAlertActive ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-red-800">Alertas activas — requiere intervención</p>
              {kycAlertActive && (
                <p className="text-xs text-red-700">
                  KYC: {kycConsecutiveBreaches} solicitudes consecutivas con procesamiento &gt;3min — revisar AWS (Lambda de verificación).
                </p>
              )}
              {disbursementAlertActive && disbursementBreach && (
                <p className="text-xs text-red-700">
                  Desembolso: crédito {disbursementBreach.creditId.slice(0, 8)}… tardó {disbursementBreach.minutesElapsed.toFixed(1)} min (&gt;15) — revisar API de la pasarela en el backend primero.
                </p>
              )}
              {apiAlertActive && (
                <p className="text-xs text-red-700">
                  APIs en ERROR: {apiErrors.map((a) => API_LABELS[a.api] ?? a.api).join(', ')}.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-800">Sin alertas activas — todo dentro de los objetivos.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end">
        <Select value={days} onValueChange={(v) => setDays(v ?? '30')}>
          <SelectTrigger className="h-8 w-52 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días (KYC / Desembolso)</SelectItem>
            <SelectItem value="14">Últimos 14 días (KYC / Desembolso)</SelectItem>
            <SelectItem value="30">Últimos 30 días (KYC / Desembolso)</SelectItem>
            <SelectItem value="90">Últimos 90 días (KYC / Desembolso)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* R46 — Estado de APIs externas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Estado de APIs externas (R46)</CardTitle>
              <CardDescription className="text-[11px]">
                Proxy pasivo sobre logs reales, sin ping activo — se refresca cada 30s. Sin fila de pasarela de pago (todavía no hay integración real).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(apiStatus?.apis ?? []).map((a) => {
              const badge = statusBadge(a.status);
              const Icon = badge.icon;
              return (
                <div key={a.api} className={`rounded-lg border p-4 flex items-center gap-3 ${badge.cls}`}>
                  <Icon className="h-6 w-6 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{API_LABELS[a.api] ?? a.api}</p>
                    <p className="text-[11px] opacity-80">{badge.label}</p>
                    <p className="text-[10px] opacity-70 truncate">
                      {a.lastCheckedAt ? new Date(a.lastCheckedAt).toLocaleString('es-PE') : 'Sin registros'}
                    </p>
                  </div>
                </div>
              );
            })}
            {!apiStatus?.apis?.length && (
              <p className="text-sm text-muted-foreground text-center py-6 col-span-3">Sin datos</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* R45 — Tiempo de procesamiento del KYC */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ScanFace className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Tiempo de procesamiento del KYC (R45)</CardTitle>
              <CardDescription className="text-[11px]">
                Objetivo &lt; {KYC_ALERT_TARGET_SECONDS}s · alerta si &gt;3min en {KYC_CONSECUTIVE_COUNT} solicitudes consecutivas
              </CardDescription>
            </div>
            {kycAlertActive && <Badge className="bg-red-100 text-red-700 ml-auto">Alerta activa</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {kyc ? (
            <>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-bold text-primary">{kyc.periodAvgSeconds.toFixed(1)}s</p>
                  <p className="text-[10px] text-muted-foreground">promedio del período</p>
                </div>
                <div>
                  <p className={`text-3xl font-bold ${kyc.periodMaxSeconds > KYC_ALERT_SECONDS ? 'text-red-700' : 'text-foreground'}`}>
                    {kyc.periodMaxSeconds.toFixed(1)}s
                  </p>
                  <p className="text-[10px] text-muted-foreground">máximo del período</p>
                </div>
              </div>
              {kyc.applications.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[...kyc.applications].sort((a, b) => a.lastAttemptAt.localeCompare(b.lastAttemptAt))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="lastAttemptAt" tickFormatter={(d) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${v}s`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => [`${Number(value ?? 0).toFixed(1)}s`, 'Tiempo']}
                      labelFormatter={(d) => new Date(d).toLocaleString('es-PE')}
                    />
                    <ReferenceLine y={KYC_ALERT_SECONDS} stroke="#DC2626" strokeDasharray="5 5" label={{ value: '3min', position: 'right', fontSize: 10, fill: '#DC2626' }} />
                    <Bar dataKey="totalProcessingSeconds" radius={[4, 4, 0, 0]}>
                      {[...kyc.applications].sort((a, b) => a.lastAttemptAt.localeCompare(b.lastAttemptAt)).map((a, i) => (
                        <Cell key={i} fill={a.totalProcessingSeconds > KYC_ALERT_SECONDS ? '#DC2626' : '#00A1CD'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin datos — el adapter de verificación activo puede ser mock/console en vez de Lambda.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* R48 — Tiempo de desembolso */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Tiempo de desembolso (R48)</CardTitle>
              <CardDescription className="text-[11px]">
                Firma de contrato → dinero en cuenta. Objetivo &lt; {DISBURSEMENT_TARGET_MINUTES}min · alerta si &gt;{DISBURSEMENT_ALERT_MINUTES}min
              </CardDescription>
            </div>
            {disbursementAlertActive && <Badge className="bg-red-100 text-red-700 ml-auto">Alerta activa</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {disbursement ? (
            <>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-bold text-primary">{disbursement.periodAvgMinutes.toFixed(1)}min</p>
                  <p className="text-[10px] text-muted-foreground">promedio del período</p>
                </div>
                <div>
                  <p className={`text-3xl font-bold ${disbursement.periodMaxMinutes > DISBURSEMENT_ALERT_MINUTES ? 'text-red-700' : 'text-foreground'}`}>
                    {disbursement.periodMaxMinutes.toFixed(1)}min
                  </p>
                  <p className="text-[10px] text-muted-foreground">máximo del período</p>
                </div>
              </div>
              {disbursement.credits.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[...disbursement.credits].sort((a, b) => a.disbursedAt.localeCompare(b.disbursedAt))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="disbursedAt" tickFormatter={(d) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => [`${Number(value ?? 0).toFixed(1)}min`, 'Tiempo']}
                      labelFormatter={(d) => new Date(d).toLocaleString('es-PE')}
                    />
                    <ReferenceLine y={DISBURSEMENT_ALERT_MINUTES} stroke="#DC2626" strokeDasharray="5 5" label={{ value: '15min', position: 'right', fontSize: 10, fill: '#DC2626' }} />
                    <Bar dataKey="minutesElapsed" radius={[4, 4, 0, 0]}>
                      {[...disbursement.credits].sort((a, b) => a.disbursedAt.localeCompare(b.disbursedAt)).map((c, i) => (
                        <Cell key={i} fill={c.minutesElapsed > DISBURSEMENT_ALERT_MINUTES ? '#DC2626' : '#00A1CD'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin créditos desembolsados en el período</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Fuera de producción el gateway es un mock con delay artificial — no refleja latencia bancaria real.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
