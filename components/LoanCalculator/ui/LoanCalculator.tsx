'use client';

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLoanCalculatorApi } from "../core/LoanCalculatorProvider";
import { GAUGE_VALUES, CARD_MAX_WIDTH, DETAIL_MAX_WIDTH } from "../core/constants";
import type { LoanConfig, LoanCalculation, ScoreResult, LoanCalculatorProps } from "../core/types";
import CreditProfileGauge from "./CreditProfileGauge";
import LoanDetail from "./LoanDetail";
import { AmountSlider, TermSelector, InstallmentSelector, Schedule, SubmitButton } from "../sections";
import { CalculatorSkeleton } from "./CalculatorSkeleton";

export type { ScoreResult };

// ── Helpers ───────────────────────────────────────────────────────────────────

function gaugeToCode(value: number, ranges: LoanConfig["creditScoreRanges"]): string {
  const idx = Math.floor(value * ranges.length);
  return ranges[Math.min(idx, ranges.length - 1)].code.toLowerCase();
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LoanCalculator({
  onDetailToggle,
  detailMode,
  dedicated = false,
  submitLabel = "Solicitar Préstamo →",
  initialSelection,
  className,
  detailMaxWidth = DETAIL_MAX_WIDTH,
}: LoanCalculatorProps = {}) {
  const api = useLoanCalculatorApi();

  const [config, setConfig] = useState<LoanConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(0);
  const [plazo, setPlazo] = useState<number | null>(null);
  const [cuotas, setCuotas] = useState<number | null>(null);
  const [gaugeScore, setGaugeScore] = useState(0.15);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [calc, setCalc] = useState<LoanCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState(false);

  const ranges = config?.creditScoreRanges ?? [];

  const activeCode = useMemo(() => {
    return config ? gaugeToCode(gaugeScore, ranges) : "";
  }, [gaugeScore, config, ranges]);

  const activeCalc = calc?.scores[activeCode] ?? null;

  // ── Monto seleccionado ─────────────────────────────────────────────────────
  const selectedAmount = useMemo(() => {
    return config?.amounts[selectedAmountIndex] ?? null;
  }, [config, selectedAmountIndex]);

  const monto = selectedAmount?.value ?? 0;

  // ── Cascading: terms disponibles según monto seleccionado ──────────────────
  const availableTerms = useMemo(() => {
    return selectedAmount?.terms ?? [];
  }, [selectedAmount]);

  // ── Cascading: installments disponibles según plazo seleccionado ────────────
  const selectedTerm = useMemo(() => {
    return availableTerms.find((t) => t.value === plazo) ?? null;
  }, [availableTerms, plazo]);

  const availableInstallments = useMemo(() => {
    return selectedTerm?.installments ?? [];
  }, [selectedTerm]);

  // ── Load config ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.fetchConfig()
      .then((cfg) => {
        setConfig(cfg);

        // Si hay initialSelection, pre-llenar con esos valores (validando que existan en config)
        if (initialSelection) {
          const amountIdx = initialSelection.amount
            ? cfg.amounts.findIndex(a => a.value === initialSelection.amount)
            : 0;
          const validAmountIdx = amountIdx >= 0 ? amountIdx : 0;
          setSelectedAmountIndex(validAmountIdx);

          const amount = cfg.amounts[validAmountIdx];
          const validTerm = initialSelection.termDays && amount?.terms.some(t => t.value === initialSelection.termDays)
            ? initialSelection.termDays
            : amount?.terms[0]?.value ?? null;
          setPlazo(validTerm);

          const term = amount?.terms.find(t => t.value === validTerm);
          const validInst = initialSelection.installmentCount && term?.installments.some(i => i.value === initialSelection.installmentCount)
            ? initialSelection.installmentCount
            : term?.installments[0]?.value ?? null;
          setCuotas(validInst);
        } else {
          setSelectedAmountIndex(0);
          const firstAmount = cfg.amounts[0];
          const firstTerm = firstAmount?.terms[0];
          setPlazo(firstTerm?.value ?? null);
          const firstInstallment = firstTerm?.installments[0];
          setCuotas(firstInstallment?.value ?? null);
        }
      })
      .catch(() => setConfigError(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // ── Calculate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!config || plazo === null || cuotas === null || monto <= 0) return;
    const controller = new AbortController();
    setCalculating(true);
    api.fetchCalculation(monto, plazo, cuotas, config, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setCalc(res);
      })
      .catch((err) => { if (err.name !== "AbortError") console.error(err); })
      .finally(() => { if (!controller.signal.aborted) setCalculating(false); });
    return () => controller.abort();
  }, [monto, plazo, cuotas, config, api]);

  // ── Cascading handlers ─────────────────────────────────────────────────────
  function handleAmountIndex(index: number) {
    setSelectedAmountIndex(index);
    const amount = config?.amounts[index];
    if (!amount) return;
    const termExists = amount.terms.some((t) => t.value === plazo);
    if (!termExists) {
      const newTerm = amount.terms[0];
      setPlazo(newTerm?.value ?? null);
      setCuotas(newTerm?.installments[0]?.value ?? null);
    } else {
      // El plazo sigue válido, verificar cuotas
      const term = amount.terms.find((t) => t.value === plazo);
      const cuotaExists = term?.installments.some((i) => i.value === cuotas);
      if (!cuotaExists) {
        setCuotas(term?.installments[0]?.value ?? null);
      }
    }
  }

  function handlePlazo(p: number) {
    setPlazo(p);
    // Verificar si las cuotas actuales existen para el nuevo plazo
    const term = selectedAmount?.terms.find((t) => t.value === p);
    const cuotaExists = term?.installments.some((i) => i.value === cuotas);
    if (!cuotaExists) {
      setCuotas(term?.installments[0]?.value ?? null);
    }
  }

  useEffect(() => {
    if (detailKey && activeCode && detailKey !== activeCode) setDetailKey(activeCode);
  }, [activeCode, detailKey]);

  useEffect(() => {
    onDetailToggle?.(!!detailKey);
  }, [detailKey, onDetailToggle]);

  // ── Error ─────────────────────────────────────────────────────────────────
  if (configError) {
    return (
      <div className="rounded-2xl shadow-lg p-8 w-80 text-center bg-white">
        <p className="font-bold mb-2">No se pudo cargar la calculadora</p>
        <button className="text-sm underline text-primary-600" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!config) return <CalculatorSkeleton />;

  // ── Scores map ─────────────────────────────────────────────────────────────
  const scoresMap = Object.fromEntries(
    ranges.map((r) => [r.code.toLowerCase(), calc?.scores[r.code.toLowerCase()]])
  );

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex gap-4 items-start justify-center relative w-full",
          detailMode === "sidebar" && detailKey ? "flex-nowrap" : "flex-wrap"
        )}
      >
        {/* ── TARJETA PRINCIPAL ── */}
        <div
          className={cn(
            "rounded-2xl shadow-2xl shrink-0 bg-white border border-neutral-200 relative w-full",
            dedicated ? "p-4 sm:p-5 md:p-6" : "p-3 sm:p-4"
          )}
          style={{ backgroundColor: "var(--lc-bg)", color: "var(--lc-text)", maxWidth: `${CARD_MAX_WIDTH}px` }}
        >
          <AmountSlider
            amounts={config.amounts}
            selectedIndex={selectedAmountIndex}
            onChange={handleAmountIndex}
          />

          <TermSelector
            terms={availableTerms}
            selected={plazo}
            onSelect={handlePlazo}
          />

          <InstallmentSelector
            installments={availableInstallments}
            selected={cuotas}
            onSelect={setCuotas}
          />

          <Schedule
            schedule={activeCalc?.schedule ?? null}
            calculating={calculating}
          />

          {/* Perfiles: gauge + pills */}
          <div className="mb-3 sm:mb-4">
            <p className="font-bold mb-2 text-sm sm:text-base">Según tu perfil pagarías:</p>
            <CreditProfileGauge
              ranges={ranges}
              scores={scoresMap}
              activeCode={activeCode}
              gaugeValue={gaugeScore}
              calculating={calculating}
              onSelectProfile={(idx) => {
                setGaugeScore(GAUGE_VALUES[idx] ?? 0.5);
              }}
              onInfoClick={(code) => {
                const idx = ranges.findIndex(r => r.code.toLowerCase() === code);
                if (idx >= 0) {
                  setGaugeScore(GAUGE_VALUES[idx] ?? 0.5);
                }
                setDetailKey(code);
              }}
            />
          </div>

          <SubmitButton
            calculating={calculating}
            requesting={requesting}
            disabled={calculating || !calc || requesting}
            label={submitLabel}
            onClick={async () => {
              if (calculating || !calc || requesting || !config) return;
              setRequestError(false);
              setRequesting(true);
              try {
                const metadata = api.collectMetadata ? await api.collectMetadata() : undefined;
                const intention = await api.createIntention({
                  productId: config.productId,
                  amount: monto,
                  termDays: plazo!,
                  installmentCount: cuotas!,
                  isFirstLoan: true,
                  selectedRangeCode: activeCode || undefined,
                  metadata,
                });
                // Solo redirigir si portalUrl es una URL real (no vacía ni placeholder)
                if (api.portalUrl && !api.portalUrl.startsWith("__")) {
                  window.location.href = `${api.portalUrl}/?intencion=${intention.id}`;
                }
                // Resetear estado después de éxito
                setRequesting(false);
              } catch {
                setRequestError(true);
                setRequesting(false);
              }
            }}
          />

          {requestError && (
            <p className="text-xs text-center mt-1" style={{ color: "var(--color-error-600)" }}>
              Ocurrió un error. Intenta nuevamente.
            </p>
          )}

          <button
            className="w-full underline mt-2 text-xs sm:text-sm text-neutral-600"
            onClick={() => setDetailKey(activeCode)}
          >
            Ver detalles
          </button>
        </div>

        {/* ── PANEL DE DETALLE ── */}
        {detailKey && (
          <>
            {detailMode === "sidebar" ? (
              <div className="shrink-0">
                <LoanDetail
                  monto={monto}
                  scoreData={calc?.scores[activeCode] ?? null}
                  cuotas={cuotas ?? 1}
                  calculating={calculating}
                  onClose={() => setDetailKey(null)}
                  maxWidth={detailMaxWidth}
                />
              </div>
            ) : (
              <>
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDetailKey(null)} />
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  onClick={() => setDetailKey(null)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <LoanDetail
                      monto={monto}
                      scoreData={calc?.scores[activeCode] ?? null}
                      cuotas={cuotas ?? 1}
                      calculating={calculating}
                      onClose={() => setDetailKey(null)}
                      maxWidth={detailMaxWidth}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
