'use client';

import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DailyIncome {
  date: string;
  amount: number;
}

interface CashflowHistory {
  days_period: number;
  daily: DailyIncome[];
}

export default function CashflowChartPage() {
  const searchParams = useSearchParams();
  const initialDays = Number(searchParams.get('days')) || 30;

  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState<CashflowHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async (selectedDays: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/kpis/cashflow/history?days=${selectedDays}`);
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  // Format chart data
  const chartData = data?.daily.map(d => ({
    date: new Date(d.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
    amount: d.amount,
  })) ?? [];

  const totalAccumulated = data?.daily.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const todayEntry = data?.daily[data.daily.length - 1];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> KPIs
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="14">14 días</SelectItem>
              <SelectItem value="20">20 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(days)}
            disabled={loading}
            className="gap-1"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Refrescar
          </Button>
        </div>
      </div>

      {/* Title + summary */}
      <div>
        <h1 className="text-xl font-bold">Ingresos a Caja — Últimos {days} días</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Todo lo que entró a caja (capital devuelto + intereses). Total acumulado:{' '}
          <span className="font-bold text-primary">S/ {totalAccumulated.toLocaleString()}</span>
          {todayEntry && (
            <> · Hoy: <span className="font-bold">S/ {todayEntry.amount.toLocaleString()}</span></>
          )}
        </p>
      </div>

      {/* Chart */}
      {loading && !data ? (
        <div className="h-80 bg-muted animate-pulse rounded-lg" />
      ) : error ? (
        <Card className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Error al cargar datos</p>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ingresos a caja por día (S/)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `S/ ${v.toLocaleString()}`}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [`S/ ${Number(value).toLocaleString()}`, 'Ingreso a caja']}
                  labelFormatter={(label) => `${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#00A1CD"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#00A1CD' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
