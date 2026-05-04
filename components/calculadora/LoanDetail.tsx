'use client';

import { X, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoreResult } from './calc-api';

interface Props {
  monto:       number;
  scoreData:   ScoreResult | null;
  cuotas:      number;
  calculating: boolean;
  onClose:     () => void;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg animate-pulse bg-neutral-200', className)} />
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
    <div className="flex justify-between items-center gap-2 text-xs sm:text-[13px] py-1.5">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-t my-1 border-neutral-200" />;
}

export default function LoanDetail({ monto, scoreData, cuotas, calculating, onClose }: Props) {
  const loading  = calculating || !scoreData;
  const color    = scoreData?.color    ?? 'var(--color-primary-500)';
  const lightBg  = scoreData?.lightBg  ?? 'var(--color-primary-50)';

  return (
    <div
      className="rounded-2xl shadow-lg overflow-hidden w-full shrink-0 flex flex-col bg-white text-neutral-800"
      style={{ width: 360, minWidth: 320, maxWidth: 380, maxHeight: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0 bg-primary-500">
        <span className="font-bold text-sm sm:text-base text-white">
          Detalle del Préstamo
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:opacity-70 transition-opacity"
          aria-label="Cerrar detalle"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Contenido scrollable */}
      <div className="overflow-y-auto flex-1 px-5 py-4">
        {/* Monto original */}
        <Row
          label={<strong>Monto Original</strong>}
          value={<strong>S/ {monto.toFixed(2)}</strong>}
        />
        <Divider />

        {/* Comisiones */}
        <section className="py-1">
          <p className="font-bold mb-2 text-xs sm:text-[13px]">Comisiones</p>
          {loading ? (
            <div className="flex flex-col gap-2 mb-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : (
            scoreData!.fees.map((fee) => (
              <div
                key={fee.key}
                className="flex justify-between items-center py-1 gap-2 text-xs sm:text-[13px]"
              >
                <span>{fee.name}</span>
                <span className="flex items-center gap-1.5">
                  {fee.discountAmount > 0 && (
                    <s className="text-[10px] sm:text-[11px] opacity-80 text-error-600">
                      S/ {fee.originalAmount.toFixed(2)}
                    </s>
                  )}
                  <span>S/ {fee.finalAmount.toFixed(2)}</span>
                </span>
              </div>
            ))
          )}
          <Divider />
          <Row
            label="Subtotal Comisiones"
            value={
              loading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="flex items-center gap-1.5">
                  {scoreData!.totalPercentageDiscounts > 0 && (
                    <s className="text-[10px] sm:text-[11px] opacity-80 text-error-600">
                      S/ {scoreData!.totalFeesOriginal.toFixed(2)}
                    </s>
                  )}
                  S/ {scoreData!.totalFeesWithPercentageDiscounts.toFixed(2)}
                </span>
              )
            }
          />
        </section>

        {/* Descuentos fijos */}
        {!loading && scoreData && (() => {
          const fixedDiscounts = scoreData.discounts.filter(
            (d) => d.calculationType === 'FIXED_AMOUNT',
          );
          return fixedDiscounts.length > 0 ? (
            <>
              <section className="py-1">
                <p className="font-bold mb-2 text-xs sm:text-[13px]">Descuentos</p>
                {fixedDiscounts.map((d) => (
                  <div key={d.key} className="flex justify-between py-1 text-xs sm:text-[13px]">
                    <span className="text-error-600">{d.name}</span>
                    <span className="text-error-600">-S/ {d.totalDiscountAmount.toFixed(2)}</span>
                  </div>
                ))}
              </section>
              <Divider />
              <Row
                label={<strong>Subtotal comisiones neto</strong>}
                value={<strong>S/ {scoreData.totalFeesResult.toFixed(2)}</strong>}
              />
            </>
          ) : null;
        })()}

        {/* IGV */}
        <Row
          label={<strong>IGV</strong>}
          value={
            loading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <strong>S/ {scoreData!.igv.toFixed(2)}</strong>
            )
          }
        />

        {/* Total */}
        <div
          className="border rounded-xl flex justify-between items-center p-2.5 my-2.5 transition-all duration-300"
          style={{ borderColor: color, backgroundColor: lightBg }}
        >
          <div>
            <p className="text-[10px] font-medium leading-none mb-1 text-neutral-500">
              Monto Total
            </p>
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <p className="font-bold leading-none tabular-nums text-sm" style={{ color }}>
                S/ {scoreData!.total.toFixed(2)}
              </p>
            )}
          </div>
          {!loading && cuotas > 1 && (
            <span className="text-[10px] text-right whitespace-nowrap text-neutral-500">
              S/ {scoreData!.cuotaAmt.toFixed(2)} × {cuotas} cuotas
            </span>
          )}
        </div>

        {/* Cronograma */}
        <div className="pt-1 pb-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Square size={12} className="text-neutral-500 fill-neutral-500" />
            <p className="font-bold text-xs sm:text-[13px]">Cronograma de Pagos</p>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: cuotas }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : (
            scoreData!.schedule.map((item) => (
              <div
                key={item.installmentNo}
                className="flex items-center gap-2 text-xs sm:text-[13px] mb-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--color-primary-500)' }}
                />
                <span>{item.label}</span>
                <strong className="ml-auto">S/ {item.amount.toFixed(2)}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
