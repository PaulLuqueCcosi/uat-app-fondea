'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface IncomeChartProps {
  grossIncomeLastDays: number;
  days?: number;
  onDaysChange?: (days: number) => void;
}

export function IncomeChart({ grossIncomeLastDays, days = 30, onDaysChange }: IncomeChartProps) {
  const [selectedDays, setSelectedDays] = useState<number>(days);

  const handleChange = (val: string | null) => {
    if (!val) return;
    const d = Number(val);
    setSelectedDays(d);
    onDaysChange?.(d);
  };

  const chartData = useMemo(() => {
    const points = selectedDays <= 7 ? 7 : selectedDays <= 14 ? 7 : 7;
    const base = grossIncomeLastDays / points;
    return Array.from({ length: points }, (_, i) => ({
      day: `D${i + 1}`,
      income: base * (i + 1) + Math.random() * base * 0.2,
    }));
  }, [grossIncomeLastDays, selectedDays]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Ingresos Brutos (últimos {selectedDays} días)
        </CardTitle>
        <Select value={String(selectedDays)} onValueChange={handleChange}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 días</SelectItem>
            <SelectItem value="14">14 días</SelectItem>
            <SelectItem value="20">20 días</SelectItem>
            <SelectItem value="30">30 días</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-2xl font-bold mb-3">
          S/ {grossIncomeLastDays.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [
                  `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  'Ingreso',
                ]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
