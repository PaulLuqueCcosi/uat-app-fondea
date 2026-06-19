'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApplicationFullDetail } from '@/lib/stores/solicitud-store';
import type { SnapshotFee, SnapshotDiscount, SnapshotScheduleItem } from '@/lib/types';

interface LoanBreakdownCardProps {
  fullDetail: ApplicationFullDetail | null;
  detailStatus: 'idle' | 'pending' | 'success' | 'error';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function TooltipText({ text, children }: { text: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <span className="cursor-pointer" onClick={() => setOpen(v => !v)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {children}
      </span>
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-lg border bg-popover text-popover-foreground border-border">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border" />
        </span>
      )}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function LoanBreakdownCard({ fullDetail, detailStatus }: LoanBreakdownCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  // Debug: score interno (no se muestra al usuario)
  if (fullDetail?.credit_score_used && process.env.NODE_ENV === 'development') {
    console.log('[SCORE DEBUG] Puntaje crediticio:', fullDetail.credit_score_used);
  }

  if (detailStatus === 'idle' || detailStatus === 'pending') {
    return <BreakdownSkeleton />;
  }

  if (!fullDetail) return null;

  const snap = fullDetail.simulation_snapshot;

  if (!snap || !snap.summary) {
    return <SimpleSummary fullDetail={fullDetail} />;
  }

  const schedule = fullDetail.schedule ?? [];
  const installmentAmount = snap.summary.totalToPay / (snap.installmentCount || 1);

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5 space-y-5">

        {/* Total a pagar + cuota */}
        <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total a pagar</p>
              <p className="text-2xl font-bold text-primary">{fmt(snap.summary.totalToPay)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-0.5">Cuota mensual</p>
              <p className="text-lg font-bold text-foreground">{fmt(installmentAmount)}</p>
              <p className="text-xs text-muted-foreground">{snap.installmentCount} cuota{snap.installmentCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Cronograma de pagos (usa fullDetail.schedule — fechas oficiales) */}
        {schedule.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Cronograma de pagos</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>#</span>
                <span>Fecha</span>
                <span className="text-right">Monto</span>
              </div>
              {schedule.map((item) => (
                <div key={item.installment_no} className="grid grid-cols-3 gap-2 px-4 py-2.5 border-t border-border text-sm">
                  <span className="text-muted-foreground">{item.installment_no}</span>
                  <span className="text-foreground">{fmtDate(item.due_date)}</span>
                  <span className="text-right font-medium text-foreground">{fmt(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ver desglose completo (expandible) */}
        <button
          type="button"
          onClick={() => setShowDetail(v => !v)}
          className="w-full flex items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Ver desglose completo
          </span>
          {showDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetail && <DetailBreakdown fullDetail={fullDetail} snap={snap} />}
      </CardContent>
    </Card>
  );
}

// ── Desglose completo (como estaba antes) ─────────────────────────────────────

function DetailBreakdown({ fullDetail, snap }: { fullDetail: ApplicationFullDetail; snap: any }) {
  const fees = Object.values(snap.fees ?? {}) as SnapshotFee[];
  const fixedDiscounts = Object.values(snap.discounts?.fixed ?? {}) as any[];
  const percentageDiscounts = Object.values(snap.discounts?.percentage ?? {}) as any[];

  const subtotalPartials = (() => {
    if (percentageDiscounts.length <= 1) return [];
    let acc = snap.summary.totalFeesOriginal;
    const partials: number[] = [];
    for (let i = 0; i < percentageDiscounts.length - 1; i++) {
      acc -= percentageDiscounts[i].totalDiscountAmount;
      partials.push(acc);
    }
    return partials;
  })();

  const hasLimitAdjustment = fullDetail.was_limit_adjusted === true;

  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      {/* Ajuste de límite */}
      {hasLimitAdjustment && (
        <div className="rounded-lg bg-warning-50 border border-warning-200 p-3 flex items-start gap-2.5 mb-2">
          <AlertTriangle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning-800">Monto ajustado por puntaje</p>
            <p className="text-warning-700 text-xs mt-0.5">
              {fullDetail.limit_note ?? `Tu límite es ${fmt(fullDetail.score_limit_amount ?? 0)}. El monto fue ajustado.`}
            </p>
          </div>
        </div>
      )}

      {/* Monto Original */}
      <Row label={<strong className="text-foreground">Monto Original</strong>} value={<strong className="text-foreground">{fmt(snap.principal)}</strong>} />
      <Divider />

      {/* Comisiones */}
      <section className="py-1.5">
        <p className="font-bold mb-2 text-sm text-foreground">Comisiones</p>
        <div className="space-y-0.5">
          {fees.map((fee) => (
            <FeeRow key={fee.name} fee={fee} />
          ))}
        </div>
        <Divider />
        <Row
          label="Subtotal"
          value={
            <span className="flex flex-wrap items-center gap-1.5 justify-end">
              {snap.summary.totalPercentageDiscounts > 0 && (
                <>
                  <TooltipText text={`${percentageDiscounts[0]?.label ?? ''} -${percentageDiscounts[0]?.value ?? 0}%`}>
                    <s className="opacity-80 text-[11px] sm:text-xs text-error-500">{fmt(snap.summary.totalFeesOriginal)}</s>
                  </TooltipText>
                  {subtotalPartials.map((p, i) => (
                    <TooltipText key={i} text={`${percentageDiscounts[i + 1]?.label ?? ''} -${percentageDiscounts[i + 1]?.value ?? 0}%`}>
                      <s className="opacity-80 text-[11px] sm:text-xs text-error-500">{fmt(p)}</s>
                    </TooltipText>
                  ))}
                </>
              )}
              <span className="text-foreground">{fmt(snap.summary.totalFeesWithPercentageDiscounts)}</span>
            </span>
          }
        />
      </section>

      {/* Descuentos fijos */}
      {fixedDiscounts.length > 0 && (
        <>
          <section className="py-1.5">
            <p className="font-bold mb-2 text-sm text-foreground">Descuentos fijos</p>
            <div className="space-y-0.5">
              {fixedDiscounts.map((d: any) => (
                <div key={d.name} className="flex justify-between py-1 text-xs sm:text-sm">
                  <span className="text-foreground">{d.label}</span>
                  <span className="text-success-600">-{fmt(d.totalDiscountAmount)}</span>
                </div>
              ))}
            </div>
          </section>
          <Divider />
          <Row
            label={<strong className="text-foreground">Subtotal</strong>}
            value={<strong className="text-foreground">{fmt(snap.summary.totalFeesResult)}</strong>}
          />
        </>
      )}

      {/* IGV */}
      <Row label={<strong className="text-foreground">IGV</strong>} value={<strong className="text-foreground">{fmt(snap.summary.totalIgvFromTotalFeesResult)}</strong>} />

      {/* Total */}
      <div className="border rounded-xl flex justify-between items-center p-3 my-2 bg-primary-50 border-primary-200">
        <div>
          <p className="font-medium leading-none mb-1 text-neutral-500 text-xs">Monto Total</p>
          <p className="font-bold leading-none tabular-nums text-base sm:text-lg text-primary">{fmt(snap.summary.totalToPay)}</p>
        </div>
        {snap.installmentCount > 1 && (
          <span className="text-right whitespace-nowrap text-xs text-muted-foreground">
            {fmt(snap.summary.totalToPay / snap.installmentCount)} × {snap.installmentCount} cuotas
          </span>
        )}
      </div>
    </div>
  );
}

// ── Vista simple (fallback sin simulation_snapshot) ────────────────────────────

function SimpleSummary({ fullDetail }: { fullDetail: ApplicationFullDetail }) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total a pagar</p>
            <p className="text-2xl font-bold text-primary">{fmt(fullDetail.total_to_pay)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Cuota mensual</p>
            <p className="text-lg font-bold text-foreground">{fmt(fullDetail.monthly_payment)}</p>
            <p className="text-xs text-muted-foreground">{fullDetail.installment_count} cuotas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function FeeRow({ fee }: { fee: SnapshotFee }) {
  return (
    <div className="flex justify-between items-center py-1 gap-2 text-xs sm:text-sm">
      <span className="text-foreground">{fee.label}</span>
      <span className="flex flex-wrap items-center gap-1.5 justify-end">
        {fee.discountAmount > 0 && fee.originalAmount > fee.finalAmount && (
          <>
            <TooltipText text={`${fee.discountHistory[0]?.label ?? ''} -${fee.discountHistory[0]?.value ?? 0}%`}>
              <s className="opacity-80 text-[11px] sm:text-xs text-error-500">{fmt(fee.originalAmount)}</s>
            </TooltipText>
            {fee.discountHistory.slice(0, -1).map((h, i) => (
              <TooltipText key={i} text={`${fee.discountHistory[i + 1]?.label ?? ''} -${fee.discountHistory[i + 1]?.value ?? 0}%`}>
                <s className="opacity-80 text-[11px] sm:text-xs text-error-500">{fmt(h.amountAfter)}</s>
              </TooltipText>
            ))}
          </>
        )}
        <span className="text-foreground">{fmt(fee.finalAmount)}</span>
      </span>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-2 text-xs sm:text-sm py-1.5">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-t my-1.5 border-border" />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BreakdownSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5 space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
