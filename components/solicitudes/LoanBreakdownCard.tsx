'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, ChevronDown, ChevronUp, AlertTriangle, Square, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreditScoreStore } from '@/lib/stores/credit-score-store';
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
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date(iso + 'T00:00:00');
  return `${DAYS[d.getDay()]} - ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// ── Tooltip (copiado del LoanDetail de la calculadora) ─────────────────────────

function TooltipText({ text, children }: { text: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <span
        className="cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
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
  const [isOpen, setIsOpen] = useState(false);

  if (detailStatus === 'idle' || detailStatus === 'pending') {
    return <BreakdownSkeleton />;
  }

  if (!fullDetail) {
    return null;
  }

  const snap = fullDetail.simulation_snapshot;

  // Si no hay simulation_snapshot o está incompleto, mostrar el resumen simple
  if (!snap || !snap.product || !snap.summary) {
    return <SimpleSummary fullDetail={fullDetail} />;
  }

  const fees = Object.values(snap.fees ?? {});
  const fixedDiscounts = Object.values(snap.discounts?.fixed ?? {});
  const percentageDiscounts = Object.values(snap.discounts?.percentage ?? {});

  // Subtotal parciales (para mostrar la cadena de descuentos %)
  const subtotalPartials = (() => {
    if (percentageDiscounts.length <= 1) return [];
    let acc = snap.summary.totalFeesOriginal;
    const partials = [];
    for (let i = 0; i < percentageDiscounts.length - 1; i++) {
      acc -= percentageDiscounts[i].totalDiscountAmount;
      partials.push(acc);
    }
    return partials;
  })();

  const hasLimitAdjustment = fullDetail.was_limit_adjusted === true;

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-xl"
      >
        <CardHeader className="py-3 px-4 sm:py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">

            {/* Izquierda: título + score */}
            <div className="flex items-start gap-2 min-w-0">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="text-md sm:text-sm font-semibold text-foreground leading-tight">
                    Desglose del préstamo
                  </h3>
              
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-md text-muted-foreground">Puntaje crediticio calculado</p>
                  <ScoreBadge score={fullDetail.credit_score_used} />
                </div>
              </div>
            </div>

            {/* Derecha: monto + chevron */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-base sm:text-lg font-bold text-primary tabular-nums">
                {fmt(snap.summary.totalToPay)}
              </span>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>

          </div>
        </CardHeader>
      </button>

      {isOpen && (
        <CardContent className="px-5 pb-5 pt-0">
          {/* Ajuste de límite */}
          {hasLimitAdjustment && (
            <div className="rounded-lg bg-warning-50 border border-warning-200 p-3 flex items-start gap-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning-800">
                  Monto ajustado por puntaje
                </p>
                <p className="text-warning-700 text-xs mt-0.5">
                  {fullDetail.limit_note ?? `Tu límite según puntaje es ${fmt(fullDetail.score_limit_amount ?? 0)}. El monto fue ajustado automáticamente.`}
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
                        <s className="opacity-80 text-[11px] sm:text-xs text-error-500">
                          {fmt(snap.summary.totalFeesOriginal)}
                        </s>
                      </TooltipText>
                      {subtotalPartials.map((p, i) => (
                        <TooltipText key={i} text={`${percentageDiscounts[i + 1]?.label ?? ''} -${percentageDiscounts[i + 1]?.value ?? 0}%`}>
                          <s className="opacity-80 text-[11px] sm:text-xs text-error-500">
                            {fmt(p)}
                          </s>
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
                  {fixedDiscounts.map((d) => (
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
          <Row
            label={<strong className="text-foreground">IGV</strong>}
            value={<strong className="text-foreground">{fmt(snap.summary.totalIgvFromTotalFeesResult)}</strong>}
          />

          {/* Total box */}
          <div className="border rounded-xl flex justify-between items-center transition-all duration-300 p-3 my-3 bg-primary-50 border-primary-200">
            <div>
              <p className="font-medium leading-none mb-1 text-neutral-500 text-xs">Monto Total</p>
              <p className="font-bold leading-none tabular-nums text-base sm:text-lg text-primary">
                {fmt(snap.summary.totalToPay)}
              </p>
            </div>
            {snap.installmentCount > 1 && (
              <span className="text-right whitespace-nowrap text-xs text-muted-foreground">
                {fmt(snap.summary.totalToPay / snap.installmentCount)} × {snap.installmentCount} cuotas
              </span>
            )}
          </div>

          {/* Cronograma */}
          <div className="pt-1 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Square size={14} className="text-muted-foreground fill-muted-foreground" />
              <p className="font-bold text-sm sm:text-base text-foreground">Cronograma de Pagos</p>
            </div>
            <div className="space-y-1.5">
              {(snap.schedule ?? []).map((item) => (
                <ScheduleRow key={item.installmentNo} item={item} />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── Vista simple (fallback sin simulation_snapshot) ────────────────────────────

function SimpleSummary({ fullDetail }: { fullDetail: ApplicationFullDetail }) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Detalle de tu préstamo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Monto</p>
            <p className="text-lg font-bold text-foreground">{fmt(fullDetail.principal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cuotas</p>
            <p className="text-lg font-bold text-foreground">{fullDetail.installment_count}x</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pago mensual</p>
            <p className="text-lg font-bold text-foreground">{fmt(fullDetail.monthly_payment)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total a pagar</p>
            <p className="text-lg font-bold text-foreground">{fmt(fullDetail.total_to_pay)}</p>
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
              <s className="opacity-80 text-[11px] sm:text-xs text-error-500">
                {fmt(fee.originalAmount)}
              </s>
            </TooltipText>
            {fee.discountHistory.slice(0, -1).map((h, i) => (
              <TooltipText key={i} text={`${fee.discountHistory[i + 1]?.label ?? ''} -${fee.discountHistory[i + 1]?.value ?? 0}%`}>
                <s className="opacity-80 text-[11px] sm:text-xs text-error-500">
                  {fmt(h.amountAfter)}
                </s>
              </TooltipText>
            ))}
          </>
        )}
        <span className="text-foreground">{fmt(fee.finalAmount)}</span>
      </span>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
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

function ScheduleRow({ item }: { item: SnapshotScheduleItem }) {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm mb-1.5">
      <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-primary" />
      <span className="text-muted-foreground">{fmtDate(item.dueDate)}</span>
      <strong className="ml-auto tabular-nums text-foreground">{fmt(item.amount)}</strong>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const scoreRanges = useCreditScoreStore(s => s.scoreRanges);
  const rangesStatus = useCreditScoreStore(s => s.rangesStatus);
  const fetchScoreRanges = useCreditScoreStore(s => s.fetchScoreRanges);

  useEffect(() => {
    if (rangesStatus === 'idle') {
      fetchScoreRanges();
    }
  }, [rangesStatus, fetchScoreRanges]);

  if (score <= 0) return null;

  const activeRange = scoreRanges?.find(
    (r) => score >= r.minScore && score <= r.maxScore,
  );

  const color = activeRange?.color ?? '#64748B';
  const label = activeRange?.label ?? '';

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
      style={{
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      <Zap className="w-3.5 h-3.5" style={{ color }} />
      {label && (
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>
          {label}
        </span>
      )}
      <span className="text-base font-extrabold tabular-nums leading-none" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BreakdownSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="py-4 px-5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      </CardHeader>
    </Card>
  );
}
