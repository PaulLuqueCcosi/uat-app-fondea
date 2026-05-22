'use client';

import { useEffect } from 'react';
import { CreditCard, AlertTriangle, Pencil, Calendar, ChevronRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { useSolicitarCalc } from './SolicitarCalcContext';
import { cn } from '@/lib/utils';

/**
 * Card del sidebar que muestra el resumen del préstamo activo del usuario.
 */
export function FunnelLoanSummaryCard() {
  const config = useIntencionStore(s => s.intencion);
  const isReady = useIntencionStore(s => s.isReady);
  const fetchIntencion = useIntencionStore(s => s.fetchIntencion);
  const { isOpen, open, close } = useSolicitarCalc();

  const loading = !isReady;

  useEffect(() => { fetchIntencion(); }, [fetchIntencion]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  /** Abre el panel de edición con los datos actuales, o lo cierra si ya está abierto */
  const handleEditClick = () => {
    if (isOpen) {
      close();
      return;
    }

    if (!config) return;

    open({
      intencionId: config.intencionId,
      amount: config.amount,
      termDays: config.termDays,
      installmentCount: config.installmentCount,
    });
  };

  if (loading) {
    return (
      <Card className="mb-6 overflow-hidden border-0 shadow-lg py-0">
        <div className="bg-linear-to-br from-primary-500 to-primary-700 p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-3 bg-white/20 rounded w-1/3" />
            <div className="h-8 bg-white/20 rounded w-1/2" />
          </div>
        </div>
        <CardContent className="p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-neutral-100 rounded w-2/3" />
          <div className="h-4 bg-neutral-100 rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="mb-6 border-warning-200 bg-warning-50 py-0">
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
    <Card className="mb-6 overflow-hidden border-0 shadow-lg py-0">
      {/* Header con gradiente */}
      <div className="bg-linear-to-br from-primary-500 to-primary-700 p-5 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-1">
              Tu Solicitud
            </p>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(config.amount)}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 text-xs text-white/90 hover:text-white hover:bg-white/15 border border-white/25 transition-all",
              isOpen && "bg-white/15"
            )}
            onClick={handleEditClick}
          >
            {isOpen ? <X className="w-3 h-3 mr-1.5" /> : <Pencil className="w-3 h-3 mr-1.5" />}
            {isOpen ? 'Cerrar' : 'Editar'}
            <ChevronRight className={cn(
              "w-3 h-3 ml-1 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </Button>
        </div>
      </div>

      {/* Detalles */}
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100">
          {/* Cuotas */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">Cuotas</p>
              <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                {config.installmentCount} {config.installmentCount === 1 ? 'cuota' : 'cuotas'}
              </p>
            </div>
          </div>

          {/* Plazo */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">Plazo</p>
              <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                {config.termDays} días
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
