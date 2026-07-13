'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote } from 'lucide-react';

interface IncomeTodayCardProps {
  incomeToday: number;
}

export function IncomeTodayCard({ incomeToday }: IncomeTodayCardProps) {
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Ingresos Hoy
        </CardTitle>
        <Banknote className="h-4 w-4 shrink-0 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-emerald-600">
          S/ {incomeToday.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-muted-foreground mt-2 capitalize">{today}</p>
      </CardContent>
    </Card>
  );
}
