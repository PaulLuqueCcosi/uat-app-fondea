'use client';

import Link from 'next/link';
import { DollarSign, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InstallmentDetailProps {
  installment: Installment;
  creditId: string;
  onClose?: () => void;
}

/**
 * Panel de detalle de una cuota seleccionada.
 * Muestra fecha, estado y botones de acción (pagar / ver crédito).
 */
export function InstallmentDetailPanel({
  installment,
  creditId,
  onClose,
}: InstallmentDetailProps) {
  return (
    <div className="rounded-lg border border-border bg-neutral-50 p-2.5 space-y-2 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-foreground">
          Cuota {installment.number} · {formatCurrency(installment.amount)}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="p-0.5 rounded hover:bg-neutral-200"
            aria-label="Cerrar detalle"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <p className="text-[9px] text-muted-foreground">
        {formatDateLong(installment.dueDate)}
        {installment.paidDate && (
          <span className="text-success-700">
            {' '}· Pagada {formatDateShort(installment.paidDate)}
          </span>
        )}
      </p>

      <div className="flex gap-1.5">
        {(installment.status === 'PENDING' || installment.status === 'UPCOMING' || installment.status === 'OVERDUE') && (
          <Link
            href={`/dashboard/creditos/${creditId}/cuotas/${installment.id}`}
            className="flex-1"
          >
            <Button
              size="xs"
              className={`w-full gap-1 ${
                installment.status === 'OVERDUE'
                  ? 'bg-error-600 text-white hover:bg-error-700'
                  : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              {installment.status === 'OVERDUE' ? 'Pagar (vencida)' : 'Pagar'}
            </Button>
          </Link>
        )}
        <Link href={`/dashboard/creditos/${creditId}`} className="flex-1">
          <Button variant="outline" size="xs" className="w-full gap-1">
            Ver crédito
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Quick Actions (cuando no hay cuota seleccionada) ─────────────────────────

interface QuickActionsProps {
  creditId: string;
  nextInstallment: Installment;
}

/**
 * Botones rápidos de "Pagar cuota" y "Ver crédito"
 * cuando no hay una cuota seleccionada.
 */
export function InstallmentQuickActions({ creditId, nextInstallment }: QuickActionsProps) {
  return (
    <div className="flex gap-1.5 pt-1">
      <Link
        href={`/dashboard/creditos/${creditId}/cuotas/${nextInstallment.id}`}
        className="flex-1"
      >
        <Button
          size="sm"
          className="w-full gap-1 bg-accent-500 text-accent-900 hover:bg-accent-400 text-[11px]"
        >
          <DollarSign className="w-3.5 h-3.5" />
          Pagar cuota
        </Button>
      </Link>
      <Link href={`/dashboard/creditos/${creditId}`} className="flex-1">
        <Button variant="outline" size="sm" className="w-full gap-1 text-[11px]">
          <CreditCard className="w-3.5 h-3.5" />
          Ver crédito
        </Button>
      </Link>
    </div>
  );
}
