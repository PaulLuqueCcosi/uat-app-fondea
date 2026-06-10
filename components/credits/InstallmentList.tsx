'use client';

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Installment } from '@/lib/credits/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InstallmentListProps {
  installments: Installment[];
  selectedId?: string | null;
  onSelect?: (installment: Installment) => void;
  /** Cuotas visibles sin scroll (default 4) */
  maxVisible?: number;
}

/**
 * Lista compacta de cuotas con scroll.
 * Reutilizable en dashboard y detalle de crédito.
 */
export function InstallmentList({
  installments,
  selectedId,
  onSelect,
  maxVisible = 4,
}: InstallmentListProps) {
  // Altura máxima: cada fila ~36px + gap 8px
  const maxHeight = maxVisible * 44;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Cuotas ({installments.length})
      </p>
      <div
        className="space-y-2 overflow-y-auto pr-1"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {installments.map((inst) => (
          <button
            key={inst.id}
            onClick={() => onSelect?.(inst)}
            className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 border text-left transition-all hover:ring-1 hover:ring-primary/20 ${
              inst.status === 'PAID'
                ? 'bg-success-50/50 border-success-200'
                : inst.status === 'PENDING'
                  ? 'bg-warning-50/50 border-warning-200'
                  : inst.status === 'OVERDUE'
                    ? 'bg-error-50/50 border-error-200'
                    : 'border-border hover:bg-neutral-50'
            } ${selectedId === inst.id ? 'ring-2 ring-primary/30' : ''}`}
          >
            {/* Status icon */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                inst.status === 'PAID'
                  ? 'bg-success-500'
                  : inst.status === 'PENDING'
                    ? 'bg-warning-400'
                    : inst.status === 'OVERDUE'
                      ? 'bg-error-500'
                      : 'bg-primary/20'
              }`}
            >
              {inst.status === 'PAID' ? (
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              ) : inst.status === 'PENDING' ? (
                <Clock className="w-2.5 h-2.5 text-warning-900" />
              ) : inst.status === 'OVERDUE' ? (
                <AlertCircle className="w-2.5 h-2.5 text-white" />
              ) : (
                <span className="text-[7px] font-bold text-primary-700">{inst.number}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground leading-tight">Cuota {inst.number}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">
                {formatDateShort(inst.dueDate)}
                {inst.paidDate && <span className="text-success-700"> · Pagada</span>}
                {inst.status === 'OVERDUE' && <span className="text-error-600"> · Vencida</span>}
              </p>
            </div>

            {/* Amount */}
            <p className="text-[10px] font-bold text-foreground shrink-0">
              {formatCurrency(inst.amount)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
