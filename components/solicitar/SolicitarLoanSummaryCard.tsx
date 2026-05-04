'use client';

import { useRouter } from 'next/navigation';
import { CreditCard, AlertTriangle, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIntencionConfig } from '@/lib/useIntencionConfig';

export function FunnelLoanSummaryCard() {
  const router = useRouter();
  const { config, loading } = useIntencionConfig();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Cargando
  if (loading) {
    return (
      <Card className="mb-6 border-primary/20 bg-linear-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-primary/10 rounded w-1/3" />
          <div className="h-7 bg-primary/10 rounded w-1/2" />
          <div className="h-4 bg-primary/10 rounded w-2/3" />
          <div className="h-4 bg-primary/10 rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  // Sin intención — error con acción
  if (!config) {
    return (
      <Card className="mb-6 border-warning-200 bg-warning-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-warning-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-warning-900">
                Sin préstamo seleccionado
              </p>
              <p className="text-xs text-warning-700 leading-relaxed">
                Debes elegir el monto y plazo antes de continuar.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs border-warning-400 text-warning-800 hover:bg-warning-100"
            onClick={() => router.push('/solicitar/calculadora')}
          >
            Ir a la calculadora
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Config cargada
  return (
    <Card className="mb-6 bg-linear-to-br from-primary/15 via-primary/10 to-primary/5 shadow-sm border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xs font-medium text-primary/70 uppercase tracking-wide">
              Tu Solicitud
            </h3>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatCurrency(config.amount)}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => router.push('/solicitar/calculadora')}
          >
            <Settings className="w-3 h-3 mr-1" />
            Editar
          </Button>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Cuotas</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {config.installmentCount} cuotas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
