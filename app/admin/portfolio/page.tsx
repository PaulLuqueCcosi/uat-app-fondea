'use client';

import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Loader2, PieChart, BarChart3, DollarSign, RefreshCw, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ── Colors ──────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#005F7A', '#00A1CD', '#7DD8F0', '#B2ECF8'];
const BAR_COLOR = '#00A1CD';

// ── Page ────────────────────────────────────────────────────────────────────

export default function PortfolioAnalyticsPage() {
  const [distributionByTerm, setDistributionByTerm] = useState<any>(null);
  const [distributionByAmount, setDistributionByAmount] = useState<any>(null);
  const [averageTicket, setAverageTicket] = useState<any>(null);
  const [rotation, setRotation] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any>(null);
  const [upcomingDue, setUpcomingDue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [termRes, amountRes, ticketRes, rotRes, cohortRes, dueRes] = await Promise.all([
        fetch('/api/admin/kpis/portfolio/analytics/distribution-by-term'),
        fetch('/api/admin/kpis/portfolio/analytics/distribution-by-amount'),
        fetch('/api/admin/kpis/portfolio/analytics/average-ticket'),
        fetch('/api/admin/kpis/portfolio/analytics/rotation'),
        fetch('/api/admin/kpis/portfolio/analytics/cohort-retention'),
        fetch('/api/admin/kpis/portfolio/analytics/upcoming-due?days=7'),
      ]);
      if (termRes.ok) setDistributionByTerm(await termRes.json());
      if (amountRes.ok) setDistributionByAmount(await amountRes.json());
      if (ticketRes.ok) setAverageTicket(await ticketRes.json());
      if (rotRes.ok) setRotation(await rotRes.json());
      if (cohortRes.ok) setCohorts(await cohortRes.json());
      if (dueRes.ok) setUpcomingDue(await dueRes.json());
    } catch (e) {
      console.error('[PORTFOLIO_ANALYTICS]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/credits" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Créditos
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="gap-1">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Refrescar
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Analytics de Cartera</h1>
          <p className="text-sm text-muted-foreground">Distribución, rotación, cohortes y próximos vencimientos</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <>
          {/* Fila 1: KPIs numéricos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* R20: Ticket promedio */}
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">S/ {averageTicket?.average_ticket?.toFixed(0) ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Ticket promedio</p>
                <p className="text-[10px] text-muted-foreground">{averageTicket?.disbursements_this_month ?? 0} desembolsos este mes</p>
              </CardContent>
            </Card>

            {/* R21: Rotación */}
            <Card>
              <CardContent className="p-4 text-center">
                <RefreshCw className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{rotation?.rotation_rate?.toFixed(1) ?? '—'}x</p>
                <p className="text-xs text-muted-foreground mt-1">Rotación mensual</p>
                <p className="text-[10px] text-muted-foreground">
                  S/ {rotation?.total_disbursed_this_month?.toLocaleString() ?? '0'} / S/ {rotation?.current_portfolio_balance?.toLocaleString() ?? '0'}
                </p>
              </CardContent>
            </Card>

            {/* Total cartera */}
            <Card>
              <CardContent className="p-4 text-center">
                <PieChart className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{distributionByTerm?.total_loans ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Préstamos activos</p>
                <p className="text-[10px] text-muted-foreground">S/ {distributionByTerm?.total_principal?.toLocaleString() ?? '0'}</p>
              </CardContent>
            </Card>

            {/* R23: Próximos a vencer */}
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{upcomingDue?.total_count ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Vencen en 7 días</p>
                <p className="text-[10px] text-muted-foreground">S/ {upcomingDue?.total_amount?.toLocaleString() ?? '0'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Fila 2: Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* R18: Distribución por plazo (dona) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Plazo</CardTitle>
              </CardHeader>
              <CardContent>
                {distributionByTerm?.segments?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={distributionByTerm.segments.map((s: any) => ({ name: `${s.term_days}d`, value: s.loan_count, pct: s.percentage }))}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
                        dataKey="value"
                        label={({ name, pct }: any) => `${name}: ${pct}%`}
                      >
                        {distributionByTerm.segments.map((_: any, i: number) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v} préstamos`, '']} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                )}
              </CardContent>
            </Card>

            {/* R19: Distribución por monto (histograma) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribución por Monto</CardTitle>
              </CardHeader>
              <CardContent>
                {distributionByAmount?.buckets?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={distributionByAmount.buckets} margin={{ top: 5, right: 20, left: 20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="range_label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v} préstamos`, 'Cantidad']} />
                      <Bar dataKey="loan_count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fila 3: Cohortes */}
          {cohorts?.cohorts?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" /> Retención por Cohortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Mes</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Clientes</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">30d</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">60d</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">90d</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.cohorts.map((c: any) => (
                        <tr key={c.month} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{c.month}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.total_clients}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.retention_30d != null ? `${c.retention_30d}%` : '—'}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.retention_60d != null ? `${c.retention_60d}%` : '—'}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.retention_90d != null ? `${c.retention_90d}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fila 4: Próximos a vencer (lista) */}
          {upcomingDue?.loans?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Préstamos próximos a vencer (7 días)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {upcomingDue.loans.map((loan: any) => (
                    <Link
                      key={loan.credit_id}
                      href={`/admin/credits/${loan.credit_id}`}
                      className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/30 rounded transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{loan.client_name ?? 'Sin nombre'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{loan.client_document}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-sm font-semibold">S/ {loan.principal}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${loan.days_until_due <= 2 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {loan.days_until_due === 0 ? 'Hoy' : `${loan.days_until_due}d`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
