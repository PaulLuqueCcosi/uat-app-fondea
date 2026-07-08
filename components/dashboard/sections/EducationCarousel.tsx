'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { EducationModuleSummary, Mascot } from '@/modules/education';

interface EducationCarouselProps {
  modules: EducationModuleSummary[];
}

/**
 * Fondea Aprende — Carrusel horizontal para el dashboard.
 * Formato "snack" y minimalista. No interrumpe la visión
 * del préstamo, pero invita a hacer clic e interactuar.
 *
 * Componente TONTO: solo recibe data y muestra. Sin fetch.
 */
export function EducationCarousel({ modules }: EducationCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 240;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (modules.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Fondea Aprende
          </span>
        </CardTitle>
        {/* <CardDescription>Educación financiera en formato snack</CardDescription> */}
      </CardHeader>

      <CardContent className="relative">
        {/* Botones de scroll */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-neutral-50"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-neutral-50"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Carrusel horizontal */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth px-1 pb-2 -mx-1 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {modules.map((mod) => (
            <Link
              key={mod.id}
              href={`/dashboard/educacion/${mod.id}`}
              className="group shrink-0 w-44"
            >
              <div className="rounded-lg border border-border overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all h-full flex flex-col">
                {/* Mini thumbnail */}
                <div className="relative h-20 w-full overflow-hidden bg-neutral-100">
                  <img
                    src={mod.thumbnail}
                    alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <img
                      src={mod.mascot === 'buho' ? '/mascotas/Fondi_pet.png' : '/mascotas/Fondea_pet.png'}
                      alt={mod.mascot === 'buho' ? 'Fondi' : 'Fondea'}
                      className="w-6 h-6 object-contain drop-shadow-sm"
                    />
                  </div>
                  {mod.videoDuration && (
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5">
                      <Play className="w-2 h-2 text-white fill-white" />
                      <span className="text-[8px] text-white">{mod.videoDuration}</span>
                    </div>
                  )}
                </div>
                {/* Texto */}
                <div className="p-2 flex-1">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Módulo {mod.order}</p>
                  <p className="text-xs font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {mod.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Link
          href="/dashboard/educacion"
          className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
        >
          Ver todos los módulos
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
