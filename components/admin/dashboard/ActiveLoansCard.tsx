'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface ActiveLoansCardProps {
  activeLoansCount: number;
  activeLoansPrincipal: number;
  history?: { day: string; value: number }[];
}

export function ActiveLoansCard({ activeLoansCount, activeLoansPrincipal, history }: ActiveLoansCardProps) {
  const mockHistory = history ?? [
    { day: 'Lun', value: activeLoansCount * 0.8 },
    { day: 'Mar', value: activeLoansCount * 0.85 },
    { day: 'Mié', value: activeLoansCount * 0.9 },
    { day: 'Jue', value: activeLoansCount * 0.92 },
    { day: 'Vie', value: activeLoansCount * 0.95 },
    { day: 'Sáb', value: activeLoansCount * 0.98 },
    { day: 'Dom', value: activeLoansCount },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Créditos Activos
        </CardTitle>
        <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{activeLoansCount.toLocaleString()}</div>
        <p className="text-sm text-muted-foreground mt-1">
          S/ {activeLoansPrincipal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHistory}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
