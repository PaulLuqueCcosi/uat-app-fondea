'use client';

import { Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { PassportSummary } from '@/modules/passport';

interface PassportDocumentProps {
  summary: PassportSummary;
  /** Si true muestra versión compacta para el dashboard */
  compact?: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = { PEN: 'S/', USD: '$', EUR: '€' };
  const symbol = symbols[currency] ?? currency;
  return `${symbol} ${amount.toLocaleString('es-PE')}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Pasaporte Financiero — versión estática (card).
 * Alternativa al FlipBook para contextos donde no se quiere interactividad.
 */
export function PassportDocument({ summary, compact = false }: PassportDocumentProps) {
  const { currentLevelIndex, points, levels } = summary;
  const current = levels[currentLevelIndex];
  const next = levels[currentLevelIndex + 1] ?? null;
  const progressPercent = next
    ? Math.min(Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100), 100)
    : 100;

  return (
    <div className="rounded-2xl overflow-hidden border border-border w-full">
      {/* ─── Portada ─── */}
      <div className="bg-primary-900 px-5 py-4 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden bg-white/10">
          <img src="/logo.png" alt="Fondea" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-[9px] tracking-[0.12em] uppercase text-white/55">Fondea Fintech</p>
          <p className="text-[17px] font-medium text-white mt-0.5">Pasaporte Financiero</p>
          {!compact && (
            <p className="text-[11px] text-white/60 mt-0.5">Documento de identidad crediticia</p>
          )}
        </div>
        {!compact && (
          <p className="text-[10px] tracking-wider text-white/40 self-end">N° 00247813</p>
        )}
      </div>

      {/* ─── Franja decorativa ─── */}
      <div className="h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,var(--color-primary-900)_8px,var(--color-primary-900)_12px)]" />

      {/* ─── Cuerpo ─── */}
      <div className="p-5 bg-card">
        <p className="text-[9px] tracking-widest uppercase text-muted-foreground pb-2 mb-3 border-b border-border">
          Sellos de nivel
        </p>

        {/* Grid de sellos */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {levels.map((level, i) => {
            const isUnlocked = i <= currentLevelIndex;

            return (
              <div
                key={level.name}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-[1.5px] transition-all ${
                  isUnlocked
                    ? `${level.meta.bgColor} ${level.meta.borderColor} border-solid`
                    : 'bg-muted/50 border-dashed border-border'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isUnlocked ? '' : 'opacity-30 grayscale'}`}>
                  {level.meta.image ? (
                    <img src={level.meta.image} alt={level.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <Award className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <p className={`text-[11px] font-medium text-center ${isUnlocked ? level.meta.color : 'text-muted-foreground'}`}>
                  {level.name}
                </p>
                <p className={`text-[10px] ${isUnlocked ? level.meta.color : 'text-muted-foreground'}`}>
                  {formatAmount(level.maxLoanAmount, level.currency)}
                </p>
              </div>
            );
          })}
        </div>

        <hr className="border-t border-dashed border-border my-4" />

        {/* Progreso */}
        {next && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Siguiente: {next.name}</span>
              <span className="text-sm font-medium text-foreground">{points} / {next.minPoints} pts</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Te faltan <span className="font-semibold text-primary-700">{next.minPoints - points} puntos</span> para {formatAmount(next.maxLoanAmount, next.currency)}
            </p>
          </div>
        )}

        {/* MRZ */}
        {!compact && (
          <div className="mt-4 font-mono text-[8px] text-border leading-relaxed tracking-wide">
            <p>P&lt;PER&lt;FINANCIERO&lt;&lt;PASAPORTE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
            <p>00247813&lt;0PER&lt;{current.name.toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;{points}PTS&lt;&lt;&lt;&lt;</p>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between ${compact ? 'mt-4 pt-3' : '-mx-5 -mb-5 mt-4 px-5 py-2.5 bg-muted/50'} border-t border-border`}>
          <Link
            href="/dashboard/pasaporte"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Ver pasaporte completo
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[10px] text-muted-foreground">
            Nivel: {current.name} · {formatAmount(current.maxLoanAmount, current.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
