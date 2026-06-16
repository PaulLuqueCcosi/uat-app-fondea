'use client';

import Link from 'next/link';
import { CheckCircle, Clock, AlertCircle, DollarSign, CreditCard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Installment } from '@/modules/credits';

// ─── Keyframe para la animación de expansión ──────────────────────────────────

const expandKeyframe = `
@keyframes expandDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 120px;
    opacity: 1;
  }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InstallmentListProps {
  installments: Installment[];
  selectedId?: string | null;
  onSelect?: (installment: Installment) => void;
  /** ID del crédito para links de acciones */
  creditId?: string;
  /** Cuotas visibles sin scroll (default 4) */
  maxVisible?: number;
}

/**
 * Lista de cuotas con detalle desplegable inline.
 * Al seleccionar una cuota, se expande debajo mostrando acciones.
 */
export function InstallmentList({
  installments,
  selectedId,
  onSelect,
  creditId,
  maxVisible = 4,
}: InstallmentListProps) {
  const maxHeight = maxVisible * 56;

  return (
    <div className="flex flex-col gap-2">
      <style dangerouslySetInnerHTML={{ __html: expandKeyframe }} />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Cuotas ({installments.length})
      </p>
      <div
        className="space-y-2 overflow-y-auto pr-1"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {installments.map((inst) => {
          const isSelected = selectedId === inst.id;

          return (
            <div key={inst.id}>
              <button
                onClick={() => onSelect?.(inst)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all hover:ring-1 hover:ring-primary/20 ${
                  inst.status === 'PAID'
                    ? 'bg-accent-50/50 border-accent-200'
                    : inst.status === 'PENDING'
                      ? 'bg-warning-50/50 border-warning-200'
                      : inst.status === 'OVERDUE'
                        ? 'bg-error-50/50 border-error-200'
                        : 'border-border hover:bg-neutral-50'
                } ${isSelected ? 'rounded-b-none' : ''}`}
              >
                {/* Status icon */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    inst.status === 'PAID'
                      ? 'bg-accent-500'
                      : inst.status === 'PENDING'
                        ? 'bg-warning-400'
                        : inst.status === 'OVERDUE'
                          ? 'bg-error-500'
                          : 'bg-primary/20'
                  }`}
                >
                  {inst.status === 'PAID' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  ) : inst.status === 'PENDING' ? (
                    <Clock className="w-3.5 h-3.5 text-warning-900" />
                  ) : inst.status === 'OVERDUE' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className="text-[9px] font-bold text-primary-700">{inst.number}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    Cuota {inst.number}
                    {inst.status === 'OVERDUE' && <span className="text-error-600"> · Vencida</span>}
                    {inst.status === 'PENDING' && <span className="text-warning-700"> · Próxima</span>}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {formatDateShort(inst.dueDate)}
                    {inst.paidDate && <span className="text-accent-700"> · Pagada</span>}
                  </p>
                </div>

                {/* Amount + chevron */}
                <p className="text-sm font-bold text-foreground shrink-0">
                  {formatCurrency(inst.amount)}
                </p>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    isSelected ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* ─── Detalle desplegable ─── */}
              {isSelected && (
                <div
                  className="border border-t-0 border-border rounded-b-lg bg-neutral-50 px-3 overflow-hidden transition-all duration-200 ease-out"
                  style={{
                    animation: 'expandDown 200ms ease-out forwards',
                  }}
                >
                  <div className="py-2.5">
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDateLong(inst.dueDate)}
                      {inst.paidDate && (
                        <span className="text-accent-700">
                          {' '}· Pagada el {formatDateShort(inst.paidDate)}
                        </span>
                      )}
                    </p>

                    {creditId && (
                      <div className="flex gap-2">
                        {(inst.status === 'PENDING' || inst.status === 'UPCOMING' || inst.status === 'OVERDUE') && (
                          <Link
                            href={`/dashboard/creditos/${creditId}/cuotas/${inst.id}`}
                            className="flex-1"
                          >
                            <Button
                              size="sm"
                              className={`w-full gap-1.5 ${
                                inst.status === 'OVERDUE'
                                  ? 'bg-error-600 text-white hover:bg-error-700'
                                  : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
                              }`}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              {inst.status === 'OVERDUE' ? 'Pagar (vencida)' : 'Pagar'}
                            </Button>
                          </Link>
                        )}
                        <Link href={`/dashboard/creditos/${creditId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            Ver crédito
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
