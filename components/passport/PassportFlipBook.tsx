'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { PassportSummary } from '@/modules/passport';

// ─── Page wrapper (forwardRef requerido por react-pageflip) ───────────────────

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '' }, ref) => (
    <div ref={ref} className={`bg-card overflow-hidden ${className}`}>
      {children}
    </div>
  )
);
Page.displayName = 'Page';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PassportFlipBookProps {
  summary: PassportSummary;
}

// ─── Meta por nivel ───────────────────────────────────────────────────────────

const levelMeta = [
  {
    stampBorder: '#B45309',
    stampBg: 'rgba(180,83,9,0.08)',
    textColor: 'text-amber-900',
    amountColor: 'text-amber-700',
  },
  {
    stampBorder: '#6B7280',
    stampBg: 'rgba(107,114,128,0.06)',
    textColor: 'text-neutral-800',
    amountColor: 'text-neutral-600',
  },
  {
    stampBorder: '#CA8A04',
    stampBg: 'rgba(202,138,4,0.08)',
    textColor: 'text-yellow-900',
    amountColor: 'text-yellow-700',
  },
  {
    stampBorder: '#0087AD',
    stampBg: 'rgba(0,135,173,0.08)',
    textColor: 'text-primary-900',
    amountColor: 'text-primary-700',
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function PassportFlipBook({ summary }: PassportFlipBookProps) {
  const { currentLevelIndex, points, levels } = summary;
  const current = levels[currentLevelIndex];

  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bookSize, setBookSize] = useState({ width: 300, height: 405 });
  const [portrait, setPortrait] = useState(false);

  // Responsive: 2 páginas si cabe, 1 en mobile
  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      // md breakpoint = 768px
      if (w < 768) {
        // Mobile: 1 página, ocupa 90% del contenedor
        const pageW = Math.min(w * 0.9, 380);
        setBookSize({ width: Math.max(240, pageW), height: Math.round(pageW * 1.35) });
        setPortrait(true);
      } else {
        // Desktop: 2 páginas, cada una ~44%
        const pageW = Math.min(w * 0.44, 380);
        setBookSize({ width: Math.max(240, pageW), height: Math.round(pageW * 1.35) });
        setPortrait(false);
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const flipNext = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext();
  }, []);

  const flipPrev = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 w-full">
      {/* Flip Book */}
      <div className="shadow-2xl rounded-xl overflow-hidden">
        {/* @ts-ignore */}
        <HTMLFlipBook
          ref={bookRef}
          width={bookSize.width}
          height={bookSize.height}
          size="stretch"
          minWidth={260}
          maxWidth={420}
          minHeight={350}
          maxHeight={570}
          drawShadow
          flippingTime={600}
          usePortrait={portrait}
          showCover
          mobileScrollSupport={false}
          className="passport-flipbook"
        >
          {/* ═══ PORTADA ═══ */}
          <Page className="rounded-l-xl">
            <div className="h-full bg-primary-900 flex flex-col items-center justify-center p-6 sm:p-8 relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,transparent_8px,transparent_12px)]" />

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/30 flex items-center justify-center mb-5 bg-white/10">
                <img src="/logo.png" alt="Fondea" className="w-11 h-11 sm:w-14 sm:h-14 object-contain" />
              </div>

              <p className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-white/50 mb-1">Fondea Fintech</p>
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-1">Pasaporte Financiero</h2>
              <p className="text-[11px] text-white/50 mb-6">Documento de identidad crediticia</p>

              <div className="px-4 py-2 rounded-full border border-white/20 bg-white/5">
                <p className="text-xs sm:text-sm text-white/80">Nivel: <span className="font-bold text-white">{current.name}</span></p>
              </div>

              <p className="text-[11px] text-white/30 mt-3">{points} puntos acumulados</p>

              <div className="absolute bottom-3 left-3 right-3 font-mono text-[6px] sm:text-[7px] text-white/15 leading-relaxed">
                <p>P&lt;PER&lt;FINANCIERO&lt;&lt;PASAPORTE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
                <p>00247813&lt;0PER&lt;{current.name.toUpperCase()}&lt;&lt;&lt;{points}PTS&lt;&lt;</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,transparent_8px,transparent_12px)]" />
            </div>
          </Page>

          {/* ═══ PÁGINAS DE SELLOS (1 por nivel) ═══ */}
          {levels.map((level, i) => {
            const isUnlocked = i <= currentLevelIndex;
            const isCurrent = i === currentLevelIndex;
            const meta = levelMeta[i] ?? levelMeta[0];
            const nextLevel = levels[i + 1] ?? null;
            const ptsNeeded = isUnlocked ? 0 : level.minPoints - points;

            return (
              <Page key={level.name}>
                <div className="h-full p-5 sm:p-6 flex flex-col items-center justify-center relative">
                  {/* Número de página */}
                  <p className="absolute top-4 right-4 text-[9px] text-muted-foreground">
                    {i + 1}/{levels.length}
                  </p>

                  {/* ─── SELLO estilo stamp ─── */}
                  <div
                    className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center ${!isUnlocked ? 'opacity-30 grayscale' : ''}`}
                    style={{
                      border: `3px ${isUnlocked ? 'solid' : 'dashed'} ${isUnlocked ? meta.stampBorder : '#d1d5db'}`,
                      background: isUnlocked ? meta.stampBg : 'transparent',
                    }}
                  >
                    {/* Anillo decorativo interior */}
                    <div
                      className="absolute inset-2 rounded-full"
                      style={{
                        border: `1.5px dashed ${isUnlocked ? meta.stampBorder : '#e5e7eb'}`,
                        opacity: 0.4,
                      }}
                    />

                    {/* Imagen */}
                    <img
                      src={level.image}
                      alt={level.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10"
                    />

                    {/* Efecto de rotación para "estampado" */}
                    {isUnlocked && (
                      <div
                        className="absolute inset-0 rounded-full border-2 opacity-20"
                        style={{
                          borderColor: meta.stampBorder,
                          transform: 'rotate(-8deg)',
                        }}
                      />
                    )}
                  </div>

                  {/* ─── Nombre del nivel ─── */}
                  <h3 className={`text-xl sm:text-2xl font-bold mt-4 ${isUnlocked ? meta.textColor : 'text-muted-foreground'}`}>
                    {level.name}
                  </h3>

                  {/* Estado */}
                  {isCurrent && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mt-1.5">
                      Tu nivel actual
                    </span>
                  )}
                  {isUnlocked && !isCurrent && (
                    <span className="text-[10px] font-medium text-accent-700 bg-accent-100 px-2.5 py-0.5 rounded-full mt-1.5">
                      ✓ Completado
                    </span>
                  )}
                  {!isUnlocked && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full mt-1.5">
                      🔒 Bloqueado
                    </span>
                  )}

                  {/* ─── Datos del sello ─── */}
                  <div className="w-full mt-5 rounded-lg border border-border p-3 space-y-2 text-center">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Límite</span>
                      <span className={`font-bold ${isUnlocked ? meta.amountColor : 'text-muted-foreground'}`}>
                        S/ {level.maxAmount.toLocaleString('es-PE')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Puntos requeridos</span>
                      <span className="font-medium text-foreground">{level.minPoints} pts</span>
                    </div>
                    {isCurrent && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Tus puntos</span>
                        <span className="font-bold text-primary">{points} pts</span>
                      </div>
                    )}
                    {!isUnlocked && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Te faltan</span>
                        <span className="font-medium text-error-600">{ptsNeeded} pts</span>
                      </div>
                    )}
                  </div>
                </div>
              </Page>
            );
          })}

          {/* ═══ CONTRAPORTADA ═══ */}
          <Page className="rounded-r-xl">
            <div className="h-full bg-primary-900 flex flex-col items-center justify-center p-6 relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,transparent_8px,transparent_12px)]" />

              <img src="/logo.png" alt="Fondea" className="w-14 h-14 object-contain mb-3 opacity-60" />
              <p className="text-sm text-white/40 mb-4">fondea.pe</p>

              <div className="text-center text-[11px] text-white/30 max-w-[220px] space-y-1">
                <p>Gana puntos pagando puntual</p>
                <p>Refiere amigos para avanzar</p>
                <p>Sube de nivel, desbloquea más</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,transparent_8px,transparent_12px)]" />
            </div>
          </Page>
        </HTMLFlipBook>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <button
          onClick={flipPrev}
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          ← Anterior
        </button>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">Desliza para voltear</span>
        <button
          onClick={flipNext}
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
