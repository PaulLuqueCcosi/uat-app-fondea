'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CapitalGaugeProps {
  portfolioUtilizationRate: number;
  capitalAvailable: number;
}

export function CapitalGauge({ portfolioUtilizationRate, capitalAvailable }: CapitalGaugeProps) {
  const rate = Math.min(Math.max(portfolioUtilizationRate, 0), 100);

  const color = rate < 70 ? '#22c55e' : rate < 90 ? '#eab308' : '#ef4444';

  const data = [
    { name: 'Usado', value: rate },
    { name: 'Libre', value: 100 - rate },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Utilización de Capital
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="h-32 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell key="usado" fill={color} />
                <Cell key="libre" fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <span className="text-2xl font-bold" style={{ color }}>
              {rate.toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Disponible:{' '}
          <span className="font-semibold text-foreground">
            S/ {capitalAvailable.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
