'use client';

import { useRef, useState, useEffect } from 'react';
import { Pencil, CreditCard, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { useSolicitarCalc } from './SolicitarCalcContext';

interface FunnelLoanSummaryBannerProps {
  isOrchestrating?: boolean;
}

/**
 * Banner compacto para mobile que muestra el resumen del préstamo.
 */
export function FunnelLoanSummaryBanner({ isOrchestrating = false }: FunnelLoanSummaryBannerProps) {
  const config = useIntencionStore(s => s.intencion);
  const status = useIntencionStore(s => s.status);
  const fetchIntencion = useIntencionStore(s => s.fetch);
  const { open } = useSolicitarCalc();
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const loading = status === 'idle' || status === 'pending';

  useEffect(() => {
    if (!isOrchestrating) fetchIntencion();
  }, [isOrchestrating, fetchIntencion]);

  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleEditClick = () => {
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
      <div className="bg-linear-to-r from-primary/10 to-primary/5 border-b border-border px-4 py-2">
        <div className="animate-pulse h-5 bg-primary/10 rounded w-1/2" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div ref={cardRef} className="bg-linear-to-r from-primary/10 to-primary/5 border-b border-border">
      {/* Fila principal siempre visible */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground font-medium">Solicitud:</span>
            <span className="text-sm font-bold text-primary">
              {formatCurrency(config.amount)}
            </span>
          </div>
          <div className="h-3.5 w-px bg-border" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] text-muted-foreground font-medium shrink-0">Cuotas:</span>
            <span className="text-xs font-semibold text-foreground truncate">
              {config.installmentCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] border-primary/50 text-primary hover:bg-primary/20 hover:border-primary font-medium px-2"
            onClick={handleEditClick}
          >
            <Pencil className="w-2.5 h-2.5 mr-1" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-primary/10 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">Cuotas</p>
              <p className="text-xs font-semibold text-foreground">
                {config.installmentCount} {config.installmentCount === 1 ? 'cuota' : 'cuotas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">Plazo</p>
              <p className="text-xs font-semibold text-foreground">
                {config.termDays} días
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
