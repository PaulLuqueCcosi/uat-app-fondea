'use client';

import { CreditCard, AlertTriangle, Pencil, Calendar, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIntencionConfig } from '@/hooks/useIntencionConfig';
import { useSolicitarCalc } from './SolicitarCalcContext';
import type { PortalInitialValues } from '@/components/LoanCalculator';
import { cn } from '@/lib/utils';

interface FunnelLoanSummaryCardProps {
  isOrchestrating?: boolean;
}

export function FunnelLoanSummaryCard({ isOrchestrating = false }: FunnelLoanSummaryCardProps) {
  // NO pasar isOrchestrating como skip — siempre obtener la intención activa
  const { config, loading, refetch } = useIntencionConfig(false);
  const { isOpen, setIsOpen, setInitialValues, setOnRefetch } = useSolicitarCalc();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleEditClick = () => {
    if (config) {
      const values: PortalInitialValues = {
        intencionId: config.intencionId,
        amount: config.amount,
        termDays: config.termDays,
        installmentCount: config.installmentCount,
      };
      setInitialValues(values);
      setOnRefetch(() => refetch);
      setIsOpen(true);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6 border-primary/20 bg-linear-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4 space-y-3 animate-pulse">
          <div className="h-3 bg-primary/10 rounded w-1/3" />
          <div className="h-7 bg-primary/10 rounded w-1/2" />
          <div className="h-px bg-primary/10 w-full" />
          <div className="h-3 bg-primary/10 rounded w-2/3" />
          <div className="h-3 bg-primary/10 rounded w-1/2" />
          <div className="h-3 bg-primary/10 rounded w-2/3" />
        </CardContent>
      </Card>
    );
  }

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
            onClick={handleEditClick}
          >
            Configurar préstamo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-linear-to-br from-primary/15 via-primary/10 to-primary/5 shadow-sm border-primary/20">
      <CardContent className="p-4 space-y-4">

        {/* Header: monto + botón editar */}
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
            className={cn(
              "h-8 text-xs border-primary/40 text-primary hover:bg-primary/10 transition-all",
              isOpen && "bg-primary/10"
            )}
            onClick={handleEditClick}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Editar
            <ChevronDown className={cn(
              "w-3 h-3 ml-1 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </div>

        <div className="border-t border-primary/10" />

        {/* Cuotas */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Cuotas</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {config.installmentCount} {config.installmentCount === 1 ? 'cuota' : 'cuotas'}
            </p>
          </div>
        </div>

        {/* Plazo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Plazo</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {config.termDays} días
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
