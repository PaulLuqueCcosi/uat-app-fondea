'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ActiveClientsCardProps {
  activeClientsCount: number;
  days?: number;
}

export function ActiveClientsCard({ activeClientsCount, days = 30 }: ActiveClientsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Clientes Activos
        </CardTitle>
        <Users className="h-4 w-4 shrink-0 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{activeClientsCount.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-2">
          Con préstamo activo en los últimos {days} días
        </p>
      </CardContent>
    </Card>
  );
}
