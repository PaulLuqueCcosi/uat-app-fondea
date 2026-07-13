'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Repeat } from 'lucide-react';

interface RepurchaseRateCardProps {
  repurchaseRate: number;
}

export function RepurchaseRateCard({ repurchaseRate }: RepurchaseRateCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Recompra
        </CardTitle>
        <Repeat className="h-4 w-4 shrink-0 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{repurchaseRate.toFixed(1)}%</div>
        <p className="text-xs text-muted-foreground mt-2">Tasa de recompra del mes</p>
      </CardContent>
    </Card>
  );
}
