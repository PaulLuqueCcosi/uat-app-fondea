'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import HTMLFlipBook from 'react-pageflip';
import type { PassportSummary } from '@/modules/passport';
import { PassportCoverPage } from './PassportCoverPage';
import { PassportStampPage } from './PassportStampPage';
import { PassportBackCoverPage } from './PassportBackCoverPage';

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

// ─── Componente ───────────────────────────────────────────────────────────────

export function PassportFlipBook({ summary }: PassportFlipBookProps) {
  const { currentLevelIndex, points, levels } = summary;
  const current = levels[currentLevelIndex];

  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bookSize, setBookSize] = useState({ width: 300, height: 405 });
  const [portrait, setPortrait] = useState(false);
  const [ready, setReady] = useState(false);

  // Responsive: 1 página en mobile (<768px), 2 páginas en md+
  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      const containerW = containerRef.current.offsetWidth;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const isMobile = viewportW < 768;

      let pageW: number;
      if (isMobile) {
        pageW = Math.min(containerW * 0.92, viewportW * 0.92, 380);
      } else {
        pageW = Math.min(containerW * 0.44, 380);
      }

      let pageH = Math.round(pageW * 1.35);

      const maxH = viewportH * (isMobile ? 0.65 : 0.75);
      if (pageH > maxH) {
        pageH = Math.round(maxH);
        pageW = Math.round(pageH / 1.35);
      }

      setBookSize({
        width: Math.max(220, Math.round(pageW)),
        height: Math.max(297, pageH),
      });
      setPortrait(isMobile);
      setReady(true);
    }

    updateSize();

    let raf: number;
    function onResize() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateSize);
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const flipNext = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext();
  }, []);

  const flipPrev = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev();
  }, []);

  if (!current) return null;

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 w-full">
      <div
        className="shadow-2xl rounded-xl overflow-hidden transition-opacity duration-200"
        style={{ opacity: ready ? 1 : 0 }}
      >
        {/* @ts-ignore */}
        <HTMLFlipBook
          ref={bookRef}
          width={bookSize.width}
          height={bookSize.height}
          minWidth={220}
          maxWidth={420}
          minHeight={297}
          maxHeight={600}
          drawShadow
          flippingTime={600}
          usePortrait={portrait}
          showCover
          mobileScrollSupport={false}
          // renderOnlyPageLengthChange
          className="passport-flipbook"
        >
          {/* Portada */}
          <Page className="rounded-l-xl">
            <PassportCoverPage currentLevel={current} points={points} />
          </Page>

          {/* Páginas de sellos */}
          {levels.map((level, i) => (
            <Page key={level.name}>
              <PassportStampPage
                level={level}
                index={i}
                totalLevels={levels.length}
                isUnlocked={i <= currentLevelIndex}
                isCurrent={i === currentLevelIndex}
                userPoints={points}
              />
            </Page>
          ))}

          {/* Contraportada */}
          <Page className="rounded-r-xl">
            <PassportBackCoverPage />
          </Page>
        </HTMLFlipBook>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <button
          onClick={flipPrev}
          aria-label="Página anterior"
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          ← Anterior
        </button>
        <Link
          href="/dashboard/pasaporte"
          className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          Ver detalles
        </Link>
        <button
          onClick={flipNext}
          aria-label="Página siguiente"
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
