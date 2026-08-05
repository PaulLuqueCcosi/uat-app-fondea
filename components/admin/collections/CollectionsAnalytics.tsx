'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import {
  MapPin, Radio, Shield, TrendingUp, BarChart3, Loader2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts';
import { getDepartments } from 'ubigeo-fns';
import type {
  NplByCityResponse,
  NplByChannelResponse,
  NplByPassportLevelResponse,
  RecoveryRateResponse,
  NplTrendResponse,
  NplByCityEntry,
  NplByChannelEntry,
  NplByPassportLevelEntry,
} from '@/modules/admin/admin-collections.types';

// ── Fetch helpers ────────────────────────────────────────────────────────────

const BASE = '/api/admin/collections/analytics';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Ubigeo resolver ──────────────────────────────────────────────────────────

function resolveCityName(ubigeoRegion: string): string {
  try {
    const deps = getDepartments();
    return deps.find((d) => d.code === ubigeoRegion)?.name ?? ubigeoRegion;
  } catch {
    return ubigeoRegion;
  }
}

// ── Channel display names ────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  REDES_SOCIALES: 'Redes Sociales',
  RECOMENDACION: 'Recomendación',
  GOOGLE: 'Google',
  PUBLICIDAD: 'Publicidad',
  OTRO: 'Otro',
};

// ── NPL rate color ───────────────────────────────────────────────────────────

function getNplColor(rate: number): string {
  if (rate <= 5) return 'text-emerald-700';
  if (rate <= 9) return 'text-amber-700';
  return 'text-red-700';
}

function getNplBadge(rate: number): { bg: string; text: string } {
  if (rate <= 5) return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
  if (rate <= 9) return { bg: 'bg-amber-50', text: 'text-amber-700' };
  return { bg: 'bg-red-50', text: 'text-red-700' };
}

// ── Main component ───────────────────────────────────────────────────────────

export function CollectionsAnalytics() {
  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState<NplByCityResponse | null>(null);
  const [channelData, setChannelData] = useState<NplByChannelResponse | null>(null);
  const [passportData, setPassportData] = useState<NplByPassportLevelResponse | null>(null);
  const [recoveryData, setRecoveryData] = useState<RecoveryRateResponse | null>(null);
  const [trendData, setTrendData] = useState<NplTrendResponse | null>(null);
  const [trendDays, setTrendDays] = useState<string>('1');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [city, channel, passport, recovery, trend] = await Promise.all([
      fetchJson<NplByCityResponse>('npl-by-city'),
      fetchJson<NplByChannelResponse>('npl-by-channel'),
      fetchJson<NplByPassportLevelResponse>('npl-by-passport-level'),
      fetchJson<RecoveryRateResponse>('recovery-rate'),
      fetchJson<NplTrendResponse>(`npl-trend?minDaysOverdue=${trendDays}`),
    ]);
    setCityData(city);
    setChannelData(channel);
    setPassportData(passport);
    setRecoveryData(recovery);
    setTrendData(trend);
    setLoading(false);
  }, [trendDays]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fetch only trend when days changes
  const handleTrendDaysChange = useCallback(async (newDays: string) => {
    setTrendDays(newDays);
    const trend = await fetchJson<NplTrendResponse>(`npl-trend?minDaysOverdue=${newDays}`);
    setTrendData(trend);
  }, []);

  if (loading && !cityData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCardSkeleton className="h-[300px]" />
        <MetricCardSkeleton className="h-[300px]" />
        <MetricCardSkeleton className="h-[300px]" />
        <MetricCardSkeleton className="h-[300px]" />
        <MetricCardSkeleton className="h-[350px] lg:col-span-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recovery Rate — KPI grande */}
      {recoveryData && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de recuperación histórica (R29)</p>
                <p className="text-3xl font-bold text-emerald-700">{recoveryData.recovery_rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {recoveryData.recovered_count} recuperados de {recoveryData.ever_overdue_count} que entraron en mora
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* R26 — NPL por ciudad */}
        <MetricCard
          icon={MapPin}
          title="NPL por Ciudad (R26)"
          description="Tasa de mora por departamento"
          onRefresh={fetchAll}
          isRefreshing={loading}
        >
          {cityData?.cities?.length ? (
            <div className="space-y-2">
              {cityData.cities
                .sort((a, b) => b.npl_rate - a.npl_rate)
                .map((city: NplByCityEntry) => {
                  const badge = getNplBadge(city.npl_rate);
                  return (
                    <div key={city.ubigeo_region} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{resolveCityName(city.ubigeo_region)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({city.overdue_loans}/{city.active_loans})
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                        {city.npl_rate.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos de ciudad</p>
          )}
        </MetricCard>

        {/* R27 — NPL por canal */}
        <MetricCard
          icon={Radio}
          title="NPL por Canal de Origen (R27)"
          description="¿Qué canal trae clientes con más mora?"
          onRefresh={fetchAll}
          isRefreshing={loading}
        >
          {channelData?.channels?.length ? (
            <div className="space-y-2">
              {channelData.channels
                .sort((a, b) => b.npl_rate - a.npl_rate)
                .map((ch: NplByChannelEntry) => {
                  const badge = getNplBadge(ch.npl_rate);
                  return (
                    <div key={ch.channel} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{CHANNEL_LABELS[ch.channel] ?? ch.channel}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({ch.overdue_loans}/{ch.active_loans})
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                        {ch.npl_rate.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos de canal</p>
          )}
        </MetricCard>

        {/* R28 — NPL por nivel Pasaporte */}
        <MetricCard
          icon={Shield}
          title="NPL por Nivel Pasaporte (R28)"
          description="Clientes Oro deberían tener menos mora"
          onRefresh={fetchAll}
          isRefreshing={loading}
        >
          {passportData?.levels?.length ? (
            <div className="space-y-2">
              {passportData.levels.map((lvl: NplByPassportLevelEntry) => {
                const badge = getNplBadge(lvl.npl_rate);
                return (
                  <div key={lvl.level} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{lvl.level}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({lvl.overdue_loans}/{lvl.active_loans})
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                      {lvl.npl_rate.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos de pasaporte</p>
          )}
        </MetricCard>

        {/* R29 — Recovery rate ya está arriba como KPI */}
        <MetricCard
          icon={TrendingUp}
          title="Detalle Recuperación (R29)"
          description="Créditos que estuvieron en mora y se cobraron"
        >
          {recoveryData ? (
            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold">{recoveryData.ever_overdue_count}</p>
                <p className="text-[10px] text-muted-foreground">Entraron en mora</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-700">{recoveryData.recovered_count}</p>
                <p className="text-[10px] text-muted-foreground">Recuperados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-700">{recoveryData.ever_overdue_count - recoveryData.recovered_count}</p>
                <p className="text-[10px] text-muted-foreground">Pendientes</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Sin datos</p>
          )}
        </MetricCard>
      </div>

      {/* R30 — Tendencia NPL 12 meses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Tendencia NPL — 12 meses (R30)</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Línea objetivo: {trendData?.target_rate ?? 9}% · Mora de {trendDays}+ días
                </p>
              </div>
            </div>
            <NativeSelect
              value={trendDays}
              onChange={(e) => handleTrendDaysChange(e.target.value)}
              className="h-8 w-32 text-sm"
            >
              <NativeSelectOption value="1">1+ día</NativeSelectOption>
              <NativeSelectOption value="7">7+ días</NativeSelectOption>
              <NativeSelectOption value="15">15+ días</NativeSelectOption>
              <NativeSelectOption value="30">30+ días</NativeSelectOption>
              <NativeSelectOption value="60">60+ días</NativeSelectOption>
              <NativeSelectOption value="90">90+ días</NativeSelectOption>
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent>
          {trendData?.months?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 15]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'NPL']}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <ReferenceLine
                  y={trendData.target_rate}
                  stroke="#DC2626"
                  strokeDasharray="5 5"
                  label={{ value: `Objetivo ${trendData.target_rate}%`, position: 'right', fontSize: 10, fill: '#DC2626' }}
                />
                <Line
                  type="monotone"
                  dataKey="npl_rate"
                  stroke="#00A1CD"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#00A1CD' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Sin datos de tendencia todavía</p>
              <p className="text-xs text-muted-foreground mt-1">
                Los datos se generan mensualmente. El gráfico se llenará conforme pasen los meses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
