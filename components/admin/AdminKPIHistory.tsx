'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DashboardKPIHistory } from '@/modules/admin';

type MetricKey = keyof Omit<DashboardKPIHistory, 'date'>;

interface MetricOption {
  key: MetricKey;
  label: string;
  color: string;
  format: 'number' | 'currency' | 'percentage';
}

const METRIC_OPTIONS: MetricOption[] = [
  { key: 'activeLoans', label: 'Préstamos activos', color: '#00A1CD', format: 'number' },
  { key: 'newApplications', label: 'Nuevas solicitudes', color: '#3b82f6', format: 'number' },
  { key: 'approvalRate', label: 'Tasa de aprobación', color: '#22c55e', format: 'percentage' },
  { key: 'disbursements', label: 'Desembolsos', color: '#8b5cf6', format: 'currency' },
  { key: 'paymentsReceived', label: 'Pagos recibidos', color: '#10b981', format: 'currency' },
  { key: 'loansDueToday', label: 'Vencimientos del día', color: '#f59e0b', format: 'number' },
  { key: 'delinquencyRate', label: 'Tasa de mora', color: '#ef4444', format: 'percentage' },
  { key: 'arrears1_7', label: 'Mora 1-7 días', color: '#f97316', format: 'number' },
  { key: 'arrears8_30', label: 'Mora 8-30 días', color: '#dc2626', format: 'number' },
  { key: 'arrears30Plus', label: 'Mora +30 días', color: '#7f1d1d', format: 'number' },
  { key: 'newUsers', label: 'Nuevos clientes', color: '#06b6d4', format: 'number' },
  { key: 'funnelConversion', label: 'Conversión embudo', color: '#a855f7', format: 'percentage' },
  { key: 'pendingComplaints', label: 'Reclamos pendientes', color: '#eab308', format: 'number' },
];

function formatValue(value: number, format: 'number' | 'currency' | 'percentage') {
  if (format === 'currency') return `S/ ${value.toLocaleString()}`;
  if (format === 'percentage') return `${value}%`;
  return value.toString();
}

interface Props {
  history: DashboardKPIHistory[];
}

export function AdminKPIHistory({ history }: Props) {
  const [selected, setSelected] = useState<MetricKey[]>(['activeLoans', 'newApplications', 'delinquencyRate']);

  const toggleMetric = (key: MetricKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 4) return prev; // max 4 líneas
      return [...prev, key];
    });
  };

  const selectedOptions = METRIC_OPTIONS.filter((o) => selected.includes(o.key));

  // Format dates for x-axis
  const chartData = history.map((h) => ({
    ...h,
    dateLabel: new Date(h.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Historial — Últimos 7 días</CardTitle>
        <p className="text-xs text-muted-foreground">Selecciona hasta 4 indicadores para comparar</p>
      </CardHeader>
      <CardContent>
        {/* Selector de métricas */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {METRIC_OPTIONS.map((opt) => {
            const isActive = selected.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleMetric(opt.key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-transparent text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                } ${selected.length >= 4 && !isActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                style={isActive ? { backgroundColor: opt.color } : undefined}
                disabled={selected.length >= 4 && !isActive}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Gráfico */}
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, name) => {
                const opt = selectedOptions.find((o) => o.key === name);
                const numVal = typeof value === 'number' ? value : Number(value);
                return [opt ? formatValue(numVal, opt.format) : value, opt?.label ?? name];
              }}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Legend
              formatter={(value) => {
                const opt = METRIC_OPTIONS.find((o) => o.key === value);
                return opt?.label ?? value;
              }}
            />
            {selectedOptions.map((opt) => (
              <Line
                key={opt.key}
                type="monotone"
                dataKey={opt.key}
                stroke={opt.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
