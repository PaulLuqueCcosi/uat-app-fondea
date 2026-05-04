'use client';

import { useState, useEffect, useMemo } from 'react';
import { Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import CreditGauge from './CreditGauge';
import CreditBar from './CreditBar';
import LoanDetail from './LoanDetail';
import { fetchLoanConfig, fetchLoanCalculation } from './calc-api';
import type { LoanConfig, LoanCalculation, ScoreResult } from './calc-api';
import { createIntencion, updateIntencion } from '@/lib/intencion-api';

// ── Tipos de tamaño ───────────────────────────────────────────────────────────
// default → calculadora completa (página /calculadora)
// compact → hero desktop: cronograma colapsado, chips de perfil, padding reducido
// mini    → hero mobile/tablet: sin cronograma, sin gauge/bar, ultra-compacto
export type CalcSize = 'default' | 'compact' | 'mini';

// ── Tipos de modo de detalle ──────────────────────────────────────────────────
// sidebar → panel lateral junto a la calculadora (comportamiento original)
// modal   → modal centrado sobre la calculadora (no desplaza el layout)
// overlay → detalle sobre la calculadora con blur (sin desplazar layout)
export type DetailMode = 'sidebar' | 'modal' | 'overlay';

export type { ScoreResult };

// ─────────────────────────────────────────────────────────────────────────────
// Hook para detectar espacio disponible
// ─────────────────────────────────────────────────────────────────────────────

function useHasSpaceForDetail() {
  const [hasSpace, setHasSpace] = useState(false);
  useEffect(() => {
    function checkSpace() {
      setHasSpace(window.innerWidth >= 1100);
    }
    checkSpace();
    window.addEventListener('resize', checkSpace);
    return () => window.removeEventListener('resize', checkSpace);
  }, []);
  return hasSpace;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de colores
// ─────────────────────────────────────────────────────────────────────────────

const USE_FIXED_COLORS = true;

const FIXED_COLORS: Record<number, { color: string; lightBg: string }> = {
  0: { color: '#EF4444', lightBg: 'rgba(239,68,68,0.08)' },   // bajo  → error-500
  1: { color: '#F59E0B', lightBg: 'rgba(245,158,11,0.08)' },  // medio → warning-500
  2: { color: '#10B981', lightBg: 'rgba(16,185,129,0.08)' },   // alto  → success-500
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function gaugeToCode(value: number, ranges: LoanConfig['creditScoreRanges']): string {
  if (!ranges || ranges.length === 0) return '';
  const idx = Math.floor(value * ranges.length);
  return ranges[Math.min(idx, ranges.length - 1)].code.toLowerCase();
}

function scoreToCenterGauge(index: number, total: number): number {
  return (index + 0.5) / total;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-neutral-200', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

function CalculatorSkeleton({ size = 'default' }: { size?: CalcSize }) {
  const isCompact = size === 'compact';
  const isMini = size === 'mini';
  const p = isMini ? 'p-3' : isCompact ? 'p-3 sm:p-4' : 'p-5';
  const maxW = isMini ? 'max-w-[320px]' : isCompact ? 'max-w-[360px]' : 'max-w-[360px] lg:max-w-[420px]';
  return (
    <div className={cn('rounded-2xl shadow-2xl w-full shrink-0 bg-white border border-neutral-200', p, maxW)}>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="mb-3">
        <Skeleton className="h-3 w-14 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-xl" />
          <Skeleton className="h-8 flex-1 rounded-xl" />
          <Skeleton className="h-8 flex-1 rounded-xl" />
        </div>
      </div>
      {!isMini && (
        <div className="mb-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
      )}
      <div className="mb-3">
        <Skeleton className="h-3 w-28 mb-2" />
        <div className="flex gap-2">
          <Skeleton className={cn('flex-1 rounded-xl', isMini ? 'h-10' : 'h-14')} />
          <Skeleton className={cn('flex-1 rounded-xl', isMini ? 'h-10' : 'h-14')} />
          <Skeleton className={cn('flex-1 rounded-xl', isMini ? 'h-10' : 'h-14')} />
        </div>
      </div>
      {!isMini && <Skeleton className="h-8 w-full rounded-xl mb-3" />}
      <Skeleton className={cn('w-full rounded-xl', isMini ? 'h-9' : 'h-10')} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface InitialValues {
  /** ID de la intención existente — si viene, el submit hace PUT en lugar de POST */
  intencionId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
}

interface LoanCalculatorProps {
  /** Datos de la intención activa del usuario, si existe */
  initialValues?: InitialValues;
  onDetailToggle?: (isOpen: boolean) => void;
  /** Tipo de indicador de perfil crediticio: "gauge" (semicírculo) o "bar" (barra horizontal) */
  indicatorType?: 'gauge' | 'bar';
  /** Variante de tamaño */
  size?: CalcSize;
  /** Cómo mostrar el panel de detalle */
  detailMode?: DetailMode;
  /** Ancho flexible (true) o fijo (false, default) */
  flexibleWidth?: boolean;
  /**
   * Callback después de un submit exitoso (crear o editar intención).
   * Si se proporciona, se llama en lugar de navegar a /solicitar/start.
   * Útil para el modal inline donde no queremos salir de la página.
   */
  onSubmitSuccess?: () => void;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function LoanCalculator({
  initialValues,
  onDetailToggle,
  indicatorType = 'bar',
  size = 'default',
  detailMode,
  flexibleWidth = false,
  onSubmitSuccess,
  className,
}: LoanCalculatorProps = {}) {
  const router = useRouter();
  const isEditing = !!initialValues?.intencionId;

  const [config, setConfig]             = useState<LoanConfig | null>(null);
  const [configError, setConfigError]   = useState(false);
  const [monto, setMonto]               = useState(0);
  const [plazo, setPlazo]               = useState<number | null>(null);
  const [cuotas, setCuotas]             = useState<number | null>(null);
  const [gaugeScore, setGaugeScore]     = useState(0.15);
  const [detailKey, setDetailKey]       = useState<string | null>(null);
  const [calc, setCalc]                 = useState<LoanCalculation | null>(null);
  const [calculating, setCalculating]   = useState(false);
  const [requesting, setRequesting]     = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const hasSpaceForDetail = useHasSpaceForDetail();
  const ranges = config?.creditScoreRanges ?? [];

  const activeCode = useMemo(
    () => (config ? gaugeToCode(gaugeScore, ranges) : ''),
    [gaugeScore, config, ranges],
  );

  const activeCalc = calc?.scores[activeCode] ?? null;

  // ── Flags de variante ──────────────────────────────────────────────────────
  const isCompact = size === 'compact';
  const isMini = size === 'mini';

  // HACK: plazo 7 días solo soporta 1 cuota en el backend
  const availableInstallments = config
    ? plazo === 7
      ? config.installments.slice(0, 1)
      : config.installments
    : [];

  // ── Cargar config y pre-llenar con initialValues si existen ───────────────
  useEffect(() => {
    fetchLoanConfig()
      .then((cfg) => {
        if (USE_FIXED_COLORS) {
          const fixedRanges = cfg.creditScoreRanges.map((range, idx) => ({
            ...range,
            color: FIXED_COLORS[idx]?.color ?? range.color,
          }));
          setConfig({ ...cfg, creditScoreRanges: fixedRanges });
        } else {
          setConfig(cfg);
        }

        if (initialValues) {
          const validAmount = cfg.amounts.some((a) => a.value === initialValues.amount)
            ? initialValues.amount
            : cfg.amounts[0]?.value ?? 0;
          const validTerm = cfg.terms.some((t) => t.value === initialValues.termDays)
            ? initialValues.termDays
            : cfg.terms[0]?.value ?? null;
          const validInstallments = cfg.installments.some((i) => i.value === initialValues.installmentCount)
            ? initialValues.installmentCount
            : cfg.installments[0]?.value ?? null;
          setMonto(validAmount);
          setPlazo(validTerm);
          setCuotas(validInstallments);
        } else {
          setMonto(cfg.amounts[0]?.value ?? 0);
          setPlazo(cfg.terms[0]?.value ?? null);
          setCuotas(cfg.installments[0]?.value ?? null);
        }
      })
      .catch(() => setConfigError(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Calcular ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!config || plazo === null || cuotas === null || monto <= 0) return;
    const controller = new AbortController();
    setCalculating(true);
    fetchLoanCalculation(monto, plazo, cuotas, config, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          if (USE_FIXED_COLORS) {
            const fixedScores = { ...res.scores };
            config.creditScoreRanges.forEach((range, idx) => {
              const key = range.code.toLowerCase();
              const fixed = FIXED_COLORS[idx];
              if (fixedScores[key] && fixed) {
                fixedScores[key] = { ...fixedScores[key], ...fixed };
              }
            });
            setCalc({ ...res, scores: fixedScores });
          } else {
            setCalc(res);
          }
        }
      })
      .catch((err) => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => { if (!controller.signal.aborted) setCalculating(false); });
    return () => controller.abort();
  }, [monto, plazo, cuotas, config]);

  // Sincronizar detailKey con activeCode
  useEffect(() => {
    if (detailKey && activeCode && detailKey !== activeCode) setDetailKey(activeCode);
  }, [activeCode, detailKey]);

  useEffect(() => {
    onDetailToggle?.(!!detailKey);
  }, [detailKey, onDetailToggle]);

  function handlePlazo(p: number) {
    setPlazo(p);
    const nextInstallments = p === 7
      ? config?.installments.slice(0, 1)
      : config?.installments;
    const exists = nextInstallments?.some((inst) => inst.value === cuotas);
    if (!exists) {
      setCuotas(nextInstallments?.[0]?.value ?? 1);
    }
  }

  async function handleSubmit() {
    if (calculating || !calc || requesting || !config || plazo === null || cuotas === null) return;
    setRequestError(null);
    setRequesting(true);

    try {
      let result;

      if (isEditing) {
        result = await updateIntencion(initialValues!.intencionId, monto, plazo, cuotas);
        if (!result) throw new Error('locked');
      } else {
        result = await createIntencion(monto, plazo, cuotas);
        if (!result) throw new Error('create_failed');
      }

      // Si hay callback de éxito (modal inline), usarlo en lugar de navegar
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push('/solicitar/start');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'locked') {
        setRequestError('Tu solicitud ya está en proceso y no puede modificarse.');
      } else {
        setRequestError('Ocurrió un error. Por favor intenta nuevamente.');
      }
      setRequesting(false);
    }
  }

  const amountMin  = config?.amounts[0]?.value ?? 0;
  const amountMax  = config?.amounts.at(-1)?.value ?? 0;
  const amountStep = config && config.amounts.length > 1
    ? config.amounts[1].value - config.amounts[0].value
    : 1;

  // ── Error de config ────────────────────────────────────────────────────────
  if (configError) {
    return (
      <div className="rounded-2xl shadow-lg p-8 w-80 text-center bg-white border border-neutral-200">
        <p className="font-bold mb-2 text-neutral-800">No se pudo cargar la calculadora</p>
        <p className="text-sm text-neutral-600 mb-4">
          Verifica que el backend público esté corriendo en el puerto configurado.
        </p>
        <button
          className="text-sm underline text-primary-600 hover:text-primary-700"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!config) return <CalculatorSkeleton size={size} />;

  // ── Clases base según tamaño ───────────────────────────────────────────────
  const cardPadding = isMini
    ? 'p-3'
    : isCompact
    ? 'p-3 sm:p-3.5'
    : 'p-3 sm:p-4 lg:p-5';

  const cardMaxW = flexibleWidth
    ? isMini
      ? 'w-full min-w-[260px] max-w-[320px]'
      : isCompact
      ? 'w-full min-w-[280px] max-w-[340px]'
      : 'w-full min-w-[320px] max-w-[440px]'
    : isMini
    ? 'w-[300px] min-w-[260px] max-w-[320px]'
    : isCompact
    ? 'w-[320px] min-w-[280px] max-w-[340px]'
    : 'w-[400px] min-w-[360px] max-w-[440px]';

  const labelSize = isMini
    ? 'text-[10px]'
    : isCompact
    ? 'text-[10px] sm:text-[11px]'
    : 'text-[11px] sm:text-xs lg:text-sm';

  const gapY = isMini ? 'mb-2' : isCompact ? 'mb-2 sm:mb-2.5' : 'mb-3.5';
  const sectionSpacing = !isCompact && !isMini ? 'mb-3.5' : gapY;

  return (
    <div className={cn('relative', className)}>
      {/* Badge de modo edición */}
      {isEditing && (
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            Editando tu préstamo actual
          </span>
        </div>
      )}

      <div
        className={cn(
          'flex gap-4 items-start justify-center relative',
          hasSpaceForDetail && detailKey ? 'flex-nowrap' : 'flex-wrap',
        )}
      >
        {/* ── TARJETA PRINCIPAL ──────────────────────────────────────── */}
        <div
          className={cn(
            'rounded-2xl shadow-2xl w-full shrink-0 bg-white border border-neutral-200 relative',
            cardPadding,
            cardMaxW,
          )}
        >
          {/* ── MONTO ─────────────────────────────────────────────────── */}
          <div className={cn('transition-all duration-300', sectionSpacing, isMini ? '-mx-1 px-1' : '')}>
            <div className={cn('flex justify-between items-center mb-1.5', isMini ? 'gap-1' : 'gap-2')}>
              <span className={cn('font-bold', labelSize)}>¿Cuánto necesitas?</span>
              <div
                className={cn(
                  'font-extrabold border border-neutral-300 rounded-lg px-2 py-0.5 w-fit tabular-nums',
                  isMini ? 'text-sm' : isCompact ? 'text-base sm:text-lg' : 'text-base sm:text-lg lg:text-xl',
                )}
              >
                S/ {monto.toFixed(2)}
              </div>
            </div>
            <input
              type="range"
              min={amountMin}
              max={amountMax}
              step={amountStep}
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--color-primary-500)' }}
            />
          </div>

          {/* ── PLAZOS ────────────────────────────────────────────────── */}
          <div className={cn('transition-all duration-300', sectionSpacing, isMini ? '-mx-1 px-1' : '')}>
            <p className={cn('font-bold mb-1', labelSize)}>Plazo</p>
            <div className={cn('flex', isMini ? 'gap-1' : 'gap-1.5 sm:gap-2')}>
              {config.terms.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handlePlazo(t.value)}
                  className={cn(
                    'flex-1 rounded-lg border font-bold transition-colors',
                    isMini ? 'py-1 text-[10px]' : isCompact ? 'py-1.5 text-[10px] sm:text-[11px]' : 'py-1.5 sm:py-2 text-[11px] sm:text-xs lg:text-sm',
                    plazo === t.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-neutral-300 text-neutral-700 hover:border-primary-300 hover:text-primary-600',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── CUOTAS (default y compact) ────────────────────────────── */}
          {!isMini && (
            <div className={cn('transition-all duration-300', sectionSpacing, isCompact ? '-mx-1 px-1' : '')}>
              <p className={cn('font-bold mb-1', labelSize)}>Cuotas</p>
              <div className={cn('flex flex-wrap', isCompact ? 'gap-1' : 'gap-1.5 sm:gap-2')}>
                {availableInstallments.map((inst) => (
                  <button
                    key={inst.value}
                    onClick={() => setCuotas(inst.value)}
                    className={cn(
                      'rounded-lg border font-bold transition-colors',
                      isCompact ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-xs sm:text-sm',
                      cuotas === inst.value
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-neutral-300 text-neutral-700 hover:border-primary-300 hover:text-primary-600',
                    )}
                  >
                    {inst.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CUOTAS mini ───────────────────────────────────────────── */}
          {isMini && (
            <div className={gapY}>
              <div className="flex items-center gap-2">
                <span className={cn('font-bold shrink-0', labelSize)}>Cuotas:</span>
                <div className="flex gap-1 flex-wrap">
                  {availableInstallments.map((inst) => (
                    <button
                      key={inst.value}
                      onClick={() => setCuotas(inst.value)}
                      className={cn(
                        'w-6 h-6 rounded border font-bold text-[9px] transition-colors',
                        cuotas === inst.value
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-neutral-300',
                      )}
                    >
                      {inst.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CRONOGRAMA: solo en default ───────────────────────────── */}
          {!isCompact && !isMini && config.installments.length > 1 && (
            <div className={sectionSpacing}>
              <p className={cn('font-bold mb-1', labelSize)}>Cronograma</p>
              {calculating || !activeCalc ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
              ) : (
                activeCalc.schedule.map((item, i) => (
                  <div key={i} className="flex text-[11px] sm:text-xs lg:text-sm mb-0.5 sm:mb-1">
                    <span className="text-neutral-700">{item.label}</span>
                    <strong className="ml-auto text-neutral-900">S/ {item.amount.toFixed(2)}</strong>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CRONOGRAMA compact: cuota del perfil activo + botón detalle ── */}
          {isCompact && config.installments.length > 1 && (
            <div className={cn(gapY, 'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 border border-neutral-200 bg-neutral-50')}>
              <div>
                <p className="text-[9px] text-neutral-500 font-medium leading-none mb-0.5">Tu cuota</p>
                {calculating || !activeCalc ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <p className="text-sm font-extrabold text-primary-500">
                    S/ {activeCalc.cuotaAmt.toFixed(2)}
                    <span className="text-[9px] font-normal text-neutral-500 ml-1">/ cuota</span>
                  </p>
                )}
              </div>
              <button
                className="text-[9px] font-bold underline shrink-0 text-primary-600"
                onClick={() => setDetailKey(activeCode)}
              >
                Ver cronograma →
              </button>
            </div>
          )}

          {/* ── PERFILES: default y compact ───────────────────────────── */}
          {!isMini && (
            <div className={sectionSpacing}>
              <p className={cn('font-bold mb-2', labelSize)}>
                {isCompact ? 'Pagarías según tu perfil:' : 'Según tu perfil pagarías:'}
              </p>
              <div className={cn('flex', isCompact ? 'gap-1' : 'gap-2')}>
                {ranges.map((range, idx) => {
                  const key = range.code.toLowerCase();
                  const s = calc?.scores[key];
                  const isActive = key === activeCode;
                  return (
                    <button
                      key={key}
                      onClick={() => setGaugeScore(scoreToCenterGauge(idx, ranges.length))}
                      className={cn(
                        'flex-1 rounded-xl text-left transition-all duration-200 relative',
                        isCompact ? 'p-1.5 border' : 'p-2.5 border',
                        isActive ? 'shadow-sm' : 'opacity-40 hover:opacity-70',
                      )}
                      style={{
                        borderColor: range.color,
                        backgroundColor: isActive ? `${range.color}12` : 'transparent',
                      }}
                    >
                      <span
                        className="absolute top-1.5 right-1.5 opacity-50 hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setDetailKey(key); }}
                      >
                        <Info size={isCompact ? 9 : 14} style={{ color: range.color }} />
                      </span>
                      <span
                        className={cn('block font-semibold uppercase tracking-wider leading-none', isCompact ? 'text-[7px] mb-1' : 'text-[10px] mb-2')}
                        style={{ color: range.color }}
                      >
                        {range.label}
                      </span>
                      {calculating || !s ? (
                        <Skeleton className={cn(isCompact ? 'h-3' : 'h-5')} />
                      ) : (
                        <div
                          className={cn('font-black tabular-nums leading-none', isCompact ? 'text-xs' : 'text-sm')}
                          style={{ color: range.color }}
                        >
                          S/ {s.total.toFixed(2)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PERFILES mini: chips horizontales con monto total ────── */}
          {isMini && (
            <div className={gapY}>
              <p className={cn('font-bold mb-1', labelSize)}>Pagarías según tu perfil:</p>
              <div className="flex gap-1.5">
                {ranges.map((range, idx) => {
                  const key = range.code.toLowerCase();
                  const s = calc?.scores[key];
                  const isActive = key === activeCode;
                  return (
                    <button
                      key={key}
                      onClick={() => setGaugeScore(scoreToCenterGauge(idx, ranges.length))}
                      className={cn(
                        'flex-1 rounded-lg border-2 py-1.5 px-1 text-center transition relative',
                        isActive ? 'opacity-100' : 'opacity-45',
                      )}
                      style={{ borderColor: range.color }}
                    >
                      <span
                        className="absolute top-1 right-1 opacity-50 hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setDetailKey(key); }}
                      >
                        <Info size={8} style={{ color: range.color }} />
                      </span>
                      <span className="text-[8px] font-bold block leading-none mb-0.5" style={{ color: range.color }}>
                        {range.label}
                      </span>
                      {calculating || !s ? (
                        <Skeleton className="h-3 w-full mt-0.5" />
                      ) : (
                        <span className="text-[11px] font-extrabold tabular-nums block" style={{ color: range.color }}>
                          S/ {s.total.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                className="w-full text-[9px] underline mt-1 text-center text-primary-600"
                onClick={() => setDetailKey(activeCode)}
              >
                Ver desglose completo →
              </button>
            </div>
          )}

          {/* ── INDICADOR: gauge o bar (solo default y compact) ───────── */}
          {!isMini && (
            <div className={gapY}>
              {indicatorType === 'bar' ? (
                <div>
                  <CreditBar value={gaugeScore} ranges={ranges} />
                  <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={gaugeScore}
                    onChange={(e) => setGaugeScore(Number(e.target.value))}
                    className="w-full mt-1"
                    style={{ accentColor: 'var(--color-primary-500)' }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <CreditGauge value={gaugeScore} ranges={ranges} />
                  <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={gaugeScore}
                    onChange={(e) => setGaugeScore(Number(e.target.value))}
                    className="w-1/2 mt-2"
                    style={{ accentColor: 'var(--color-primary-500)' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── CTA ───────────────────────────────────────────────────── */}
          <button
            className={cn(
              'w-full rounded-xl font-bold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed',
              isMini ? 'py-2 text-xs mt-1' : isCompact ? 'py-2 sm:py-2.5 text-xs sm:text-sm mt-2' : 'py-2.5 sm:py-3 lg:py-4 text-xs sm:text-sm lg:text-base mt-2 sm:mt-3 lg:mt-4',
              isEditing
                ? 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
                : 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
            )}
            disabled={calculating || !calc || requesting}
            onClick={handleSubmit}
          >
            {requesting
              ? 'Procesando...'
              : calculating
              ? 'Calculando...'
              : isEditing
              ? 'Guardar cambios →'
              : 'Solicitar Préstamo →'}
          </button>

          {requestError && (
            <p className={cn('text-center mt-1 text-error-600', isMini ? 'text-[9px]' : 'text-xs')}>
              {requestError}
            </p>
          )}

          {/* Ver detalles: solo en default */}
          {!isCompact && !isMini && (
            <button
              className="w-full text-[11px] sm:text-xs lg:text-sm underline mt-1.5 sm:mt-2 text-primary-600 hover:text-primary-700 transition-colors"
              onClick={() => setDetailKey(activeCode)}
            >
              Ver detalles del préstamo
            </button>
          )}

          {/* ── OVERLAY: detalle sobre la calculadora con blur ──────── */}
          {detailKey && detailMode === 'overlay' && (
            <div className="absolute inset-0 flex items-start justify-center rounded-2xl overflow-hidden" style={{ height: '100%' }}>
              <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} />
              <div className="relative z-10 flex flex-col" style={{ maxHeight: '100%', height: '100%' }}>
                <LoanDetail
                  monto={monto}
                  scoreData={calc?.scores[activeCode] ?? null}
                  cuotas={cuotas ?? 1}
                  calculating={calculating}
                  onClose={() => setDetailKey(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── PANEL LATERAL / MODAL DE DETALLE ──────────────────────── */}
        {detailKey && (
          <>
            {(detailMode === 'sidebar' || (!detailMode && hasSpaceForDetail)) ? (
              <div className="shrink-0">
                <LoanDetail
                  monto={monto}
                  scoreData={calc?.scores[activeCode] ?? null}
                  cuotas={cuotas ?? 1}
                  calculating={calculating}
                  onClose={() => setDetailKey(null)}
                />
              </div>
            ) : detailMode !== 'overlay' ? (
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
                    />
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
