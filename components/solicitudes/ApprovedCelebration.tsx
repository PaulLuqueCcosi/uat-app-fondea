'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Animación de celebración cuando la solicitud es pre-aprobada.
 * Overlay fullscreen con check animado — dura 2.5 segundos.
 */
export function ApprovedCelebration() {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    requestAnimationFrame(() => setPhase('show'));
    const timer = setTimeout(() => setPhase('exit'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center transition-all duration-700',
      phase === 'enter' ? 'bg-primary-900/0 backdrop-blur-0' : 'bg-primary-900/40 backdrop-blur-sm'
    )}>
      {/* Círculos decorativos */}
      <div className={cn(
        'absolute inset-0 overflow-hidden transition-opacity duration-1000',
        phase === 'enter' ? 'opacity-0' : 'opacity-100'
      )}>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }} />
      </div>

      <div className={cn(
        'flex flex-col items-center gap-8 transition-all duration-700 ease-out relative',
        phase === 'enter' ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
        phase === 'exit' ? 'scale-110 opacity-0' : ''
      )}>
        {/* Check animado */}
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r="65"
              fill="none"
              stroke="var(--color-primary-200)"
              strokeWidth="3"
              className="transition-all duration-500 ease-out origin-center"
              style={{
                transform: phase === 'enter' ? 'scale(0)' : 'scale(1)',
                opacity: phase === 'show' ? 0.6 : 0,
              }}
            />
            <circle
              cx="70" cy="70" r="55"
              fill="var(--color-primary-500)"
              className="transition-all duration-500 ease-out origin-center"
              style={{ transform: phase === 'enter' ? 'scale(0)' : 'scale(1)' }}
            />
            <path
              d="M42 70 L60 88 L98 50"
              fill="none"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="90"
              strokeDashoffset={phase === 'show' ? '0' : '90'}
              style={{ transition: 'stroke-dashoffset 0.6s ease-out 0.4s' }}
            />
          </svg>
          {/* Destellos */}
          <div className={cn(
            'absolute -top-3 -right-3 w-6 h-6 bg-accent-500 rounded-full transition-all duration-500',
            phase === 'show' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} style={{ transitionDelay: '600ms' }} />
          <div className={cn(
            'absolute -bottom-2 -left-4 w-4 h-4 bg-primary-300 rounded-full transition-all duration-500',
            phase === 'show' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} style={{ transitionDelay: '800ms' }} />
          <div className={cn(
            'absolute top-0 -left-6 w-3 h-3 bg-accent-400 rounded-full transition-all duration-500',
            phase === 'show' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )} style={{ transitionDelay: '700ms' }} />
        </div>

        <div className={cn(
          'text-center space-y-3 transition-all duration-500',
          phase === 'enter' ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
        )} style={{ transitionDelay: '400ms' }}>
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">
            ¡Pre-aprobado!
          </h2>
          <p className="text-primary-100 text-lg">
            Tu solicitud ha sido aprobada
          </p>
        </div>
      </div>
    </div>
  );
}
