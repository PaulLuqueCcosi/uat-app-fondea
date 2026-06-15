import type { PassportLevel } from '@/modules/passport';

interface PassportStampPageProps {
  level: PassportLevel;
  index: number;
  totalLevels: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  userPoints: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = { PEN: 'S/', USD: '$', EUR: '€' };
  const symbol = symbols[currency] ?? currency;
  return `${symbol} ${(amount ?? 0).toLocaleString('es-PE')}`;
}

function getStampBorderColor(borderClass: string): string {
  const map: Record<string, string> = {
    'border-amber-200': '#B45309',
    'border-neutral-300': '#6B7280',
    'border-yellow-300': '#CA8A04',
    'border-primary-200': '#0087AD',
  };
  return map[borderClass] ?? '#6B7280';
}

function getStampBgColor(borderClass: string): string {
  const map: Record<string, string> = {
    'border-amber-200': 'rgba(180,83,9,0.08)',
    'border-neutral-300': 'rgba(107,114,128,0.06)',
    'border-yellow-300': 'rgba(202,138,4,0.08)',
    'border-primary-200': 'rgba(0,135,173,0.08)',
  };
  return map[borderClass] ?? 'rgba(107,114,128,0.06)';
}

// Código MRZ-style derivado del nombre del nivel (solo decorativo)
function mrzCode(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '<');
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Página individual de un sello/nivel del pasaporte.
 * Diseño inspirado en una página de visado: sello + ficha de datos + MRZ.
 */
export function PassportStampPage({
  level,
  index,
  totalLevels,
  isUnlocked,
  isCurrent,
  userPoints,
}: PassportStampPageProps) {
  const stampBorder = getStampBorderColor(level.meta.borderColor);
  const stampBg = getStampBgColor(level.meta.borderColor);
  const ptsNeeded = isUnlocked ? 0 : level.minPoints - userPoints;
  const rangeLabel = level.maxPoints
    ? `${level.minPoints} – ${level.maxPoints} pts`
    : `${level.minPoints}+ pts`;
  const code = mrzCode(level.name).padEnd(20, '<').slice(0, 20);

  return (
    <div className="h-full relative flex flex-col">
      {/* Textura de fondo tipo papel de seguridad */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 14px)`,
          color: stampBorder,
        }}
      />
      {/* Guilloché central muy sutil */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0%, transparent 60%, currentColor 60.5%, transparent 61%)`,
          backgroundSize: '24px 24px',
          color: stampBorder,
        }}
      />

      {/* ─── Encabezado tipo visado ─── */}
      <div className="relative px-5 pt-4 pb-2 border-b border-dashed border-border/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground">
              Visa · Nivel {String(index + 1).padStart(2, '0')}
            </p>
            <p className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground/60">
              Fondea Fintech · PE
            </p>
          </div>
          <div className="text-right">
            {isCurrent && (
              <span className="text-[9px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                VIGENTE
              </span>
            )}
            {isUnlocked && !isCurrent && (
              <span className="text-[9px] font-semibold text-accent-700 bg-accent-100 px-2 py-0.5 rounded-full">
                EMITIDA
              </span>
            )}
            {!isUnlocked && (
              <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                PENDIENTE
              </span>
            )}
            <p className="text-[8px] text-muted-foreground/50 mt-1">{index + 1}/{totalLevels}</p>
          </div>
        </div>
      </div>

      {/* ─── Cuerpo ─── */}
      <div className="relative flex-1 px-5 py-4 flex flex-col items-center justify-center">
        {/* ─── SELLO ─── */}
        <div
          className={`relative w-28 h-28 rounded-full flex items-center justify-center ${!isUnlocked ? 'opacity-30 grayscale' : ''}`}
          style={{
            border: `3px ${isUnlocked ? 'solid' : 'dashed'} ${isUnlocked ? stampBorder : '#d1d5db'}`,
            background: isUnlocked ? stampBg : 'transparent',
          }}
        >
          <div
            className="absolute inset-2 rounded-full"
            style={{
              border: `1.5px dashed ${isUnlocked ? stampBorder : '#e5e7eb'}`,
              opacity: 0.4,
            }}
          />
          <img
            src={level.meta.image}
            alt={level.name}
            className="w-16 h-16 object-contain relative z-10"
          />
          {isUnlocked && (
            <div
              className="absolute inset-0 rounded-full border-2 opacity-20"
              style={{ borderColor: stampBorder, transform: 'rotate(-8deg)' }}
            />
          )}
          {/* Texto circular tipo sello oficial */}
          {isUnlocked && (
            <p
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-bold tracking-[0.25em] uppercase whitespace-nowrap px-1.5 rounded-full"
              style={{ color: stampBorder, background: 'var(--color-card)' }}
            >
              · Aprobado ·
            </p>
          )}
        </div>

        {/* ─── Nombre del nivel ─── */}
        <h3 className={`text-xl font-bold mt-4 ${isUnlocked ? level.meta.color : 'text-muted-foreground'}`}>
          {level.name}
        </h3>
        <p className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground/60 mt-0.5">
          Categoría de membresía
        </p>

        {/* ─── Ficha de datos tipo pasaporte ─── */}
        <div className="w-full mt-4 rounded-lg border border-border/70 bg-card/40 p-3 space-y-2 text-xs">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground">
              Límite de crédito
            </span>
            <span className={`font-bold ${isUnlocked ? level.meta.color : 'text-muted-foreground'}`}>
              {formatAmount(level.maxLoanAmount, level.currency)}
            </span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground">
              Rango de puntos
            </span>
            <span className="font-medium text-foreground">{rangeLabel}</span>
          </div>
          {isCurrent && (
            <>
              <div className="h-px bg-border/50" />
              <div className="flex justify-between items-baseline">
                <span className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground">
                  Tus puntos
                </span>
                <span className="font-bold text-primary">{userPoints} pts</span>
              </div>
            </>
          )}
          {!isUnlocked && (
            <>
              <div className="h-px bg-border/50" />
              <div className="flex justify-between items-baseline">
                <span className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground">
                  Te faltan
                </span>
                <span className="font-medium text-error-600">{ptsNeeded} pts</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MRZ inferior (sutil, decorativo) ─── */}
      <div className="relative px-5 pb-3 pt-2 border-t border-dashed border-border/60">
        <div className="font-mono text-[6px] text-muted-foreground/30 leading-relaxed tracking-wider">
          <p>V&lt;PER&lt;FONDEA&lt;&lt;{code}</p>
          <p>{String(index + 1).padStart(2, '0')}{String(totalLevels).padStart(2, '0')}{isUnlocked ? '1' : '0'}&lt;&lt;&lt;{String(userPoints).padEnd(6, '0').slice(0, 6)}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
        </div>
      </div>
    </div>
  );
}