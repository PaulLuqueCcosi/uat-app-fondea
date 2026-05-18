import { useState, useRef, useEffect } from "react";
import { X, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreResult } from "../core/types";
import { DETAIL_MAX_WIDTH } from "../core/constants";

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
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
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
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap shadow-lg border"
          style={{
            backgroundColor: "var(--lc-bg)",
            color: "var(--lc-text)",
            borderColor: "var(--lc-border)",
          }}
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent"
            style={{ borderTopColor: "var(--lc-border)" }}
          />
        </span>
      )}
    </span>
  );
}

interface Props {
  monto: number;
  scoreData: ScoreResult | null;
  cuotas: number;
  calculating: boolean;
  onClose: () => void;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-lg animate-pulse", className)}
      style={{ backgroundColor: "#e5e7eb" }}
    />
  );
}

export default function LoanDetail({
  monto,
  scoreData,
  cuotas,
  calculating,
  onClose,
}: Props) {
  const loading = calculating || !scoreData;
  const color = scoreData?.color ?? "var(--lc-primary)";
  const lightBg = scoreData?.lightBg ?? "var(--lc-primary-light)";

  const fixedDiscounts = !loading && scoreData
    ? scoreData.discounts.filter((d) => d.type === "FIXED_AMOUNT")
    : [];

  const percentageDiscounts = !loading && scoreData
    ? scoreData.discounts.filter((d) => d.type === "PERCENTAGE")
    : [];

  const subtotalPartials = (() => {
    if (loading || !scoreData || percentageDiscounts.length <= 1) return [];
    let acc = scoreData.totalFeesOriginal;
    const partials = [];
    for (let i = 0; i < percentageDiscounts.length - 1; i++) {
      acc -= percentageDiscounts[i].totalDiscountAmount;
      partials.push(acc);
    }
    return partials;
  })();

  return (
    <div
      className="rounded-2xl shadow-lg overflow-hidden w-full shrink-0 font-sans flex flex-col"
      style={{ backgroundColor: "var(--lc-bg)", color: "var(--lc-text)", maxHeight: "100%", maxWidth: `${DETAIL_MAX_WIDTH}px`, minWidth: "320px" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between z-10 shrink-0 px-5 sm:px-6 py-3 sm:py-4"
        style={{ backgroundColor: "var(--lc-header-bg)" }}
      >
        <span
          className="font-bold text-sm sm:text-base"
          style={{ color: "var(--lc-header-text)" }}
        >
          Detalle del Préstamo
        </span>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer p-1 rounded-full hover:opacity-70 transition-opacity"
          aria-label="Cerrar"
        >
          <X size={20} style={{ color: "var(--lc-header-text)" }} />
        </button>
      </div>

      {/* Contenido — scroll solo si rebasa */}
      <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-3 sm:py-4">
        {/* Monto original */}
        <Row label={<strong>Monto Original</strong>} value={<strong>S/ {monto.toFixed(2)}</strong>} />
        <Divider />

        {/* Comisiones */}
        <section className="py-1.5">
          <p className="font-bold mb-2 text-sm sm:text-base">Comisiones</p>
          {loading ? (
            <div className="flex flex-col gap-2.5 mb-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            scoreData!.fees.map((fee) => (
              <div
                key={fee.key}
                className="flex justify-between items-center py-1 gap-2 text-xs sm:text-sm"
              >
                <span>{fee.label}</span>
                <span className="flex flex-wrap items-center gap-1.5 justify-end">
                  {fee.discountAmount > 0 && (
                    <>
                      <TooltipText text={`${fee.discountHistory[0]?.label ?? ""} -${fee.discountHistory[0]?.value ?? 0}%`}>
                        <s className="opacity-80 text-[11px] sm:text-xs" style={{ color: "#EF4444" }}>
                          S/ {fee.originalAmount.toFixed(2)}
                        </s>
                      </TooltipText>
                      {fee.discountHistory.slice(0, -1).map((h, i) => (
                        <TooltipText key={i} text={`${fee.discountHistory[i + 1]?.label ?? ""} -${fee.discountHistory[i + 1]?.value ?? 0}%`}>
                          <s className="opacity-80 text-[11px] sm:text-xs" style={{ color: "#EF4444" }}>
                            S/ {h.amountAfter.toFixed(2)}
                          </s>
                        </TooltipText>
                      ))}
                    </>
                  )}
                  <span>S/ {fee.finalAmount.toFixed(2)}</span>
                </span>
              </div>
            ))
          )}
          <Divider />
          <Row
            label="Subtotal"
            value={
              loading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <span className="flex flex-wrap items-center gap-1.5 justify-end">
                  {scoreData!.totalPercentageDiscounts > 0 && (
                    <>
                      <TooltipText text={`${percentageDiscounts[0]?.label ?? ""} -${percentageDiscounts[0]?.value ?? 0}%`}>
                        <s className="opacity-80 text-[11px] sm:text-xs" style={{ color: "#EF4444" }}>
                          S/ {scoreData!.totalFeesOriginal.toFixed(2)}
                        </s>
                      </TooltipText>
                      {subtotalPartials.map((p, i) => (
                        <TooltipText key={i} text={`${percentageDiscounts[i + 1]?.label ?? ""} -${percentageDiscounts[i + 1]?.value ?? 0}%`}>
                          <s className="opacity-80 text-[11px] sm:text-xs" style={{ color: "#EF4444" }}>
                            S/ {p.toFixed(2)}
                          </s>
                        </TooltipText>
                      ))}
                    </>
                  )}
                  <span>S/ {scoreData!.totalFeesWithPercentageDiscounts.toFixed(2)}</span>
                </span>
              )
            }
          />
        </section>

        {/* Descuentos fijos */}
        {!loading && fixedDiscounts.length > 0 && (
          <>
            <section className="py-1.5">
              <p className="font-bold mb-2 text-sm sm:text-base">Descuentos fijos</p>
              {fixedDiscounts.map((d) => (
                <div key={d.key} className="flex justify-between py-1 text-xs sm:text-sm">
                  <span>{d.label}</span>
                  <span style={{ color: "var(--lc-bajo)" }}>
                    -S/ {d.totalDiscountAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </section>
            <Divider />
            <Row
              label={<strong>Subtotal</strong>}
              value={<strong>S/ {scoreData!.totalFeesResult.toFixed(2)}</strong>}
            />
          </>
        )}

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

        {/* Total box */}
        <div
          className="border rounded-xl flex justify-between items-center transition-all duration-300 p-3 my-3"
          style={{ borderColor: color, backgroundColor: lightBg }}
        >
          <div>
            <p className="font-medium leading-none mb-1 text-neutral-500 text-xs">Monto Total</p>
            {loading ? (
              <Skeleton className="w-24 h-5" />
            ) : (
              <p className="font-bold leading-none tabular-nums text-base sm:text-lg" style={{ color }}>
                S/ {scoreData!.total.toFixed(2)}
              </p>
            )}
          </div>
          {!loading && cuotas > 1 && (
            <span className="text-right whitespace-nowrap text-xs" style={{ color: "var(--lc-muted)" }}>
              S/ {scoreData!.cuotaAmt.toFixed(2)} × {cuotas} cuotas
            </span>
          )}
        </div>

        {/* Cronograma */}
        <div className="pt-1 pb-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Square size={14} style={{ color: "var(--lc-muted)", fill: "var(--lc-muted)" }} />
            <p className="font-bold text-sm sm:text-base">Cronograma de Pagos</p>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: cuotas }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-2.5 h-2.5 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            scoreData!.schedule.map((item) => (
              <div
                key={item.installmentNo}
                className="flex items-center gap-2 text-xs sm:text-sm mb-1.5"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--lc-primary)" }}
                />
                <span>{item.label}</span>
                <strong className="ml-auto tabular-nums">S/ {item.amount.toFixed(2)}</strong>
              </div>
            ))
          )}
        </div>
      </div>
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
  return <hr className="border-t my-1.5" style={{ borderColor: "#ebebeb" }} />;
}
