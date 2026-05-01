'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContinueButtonProps {
  onClick: () => void;
  /** Si está activo, muestra la barra de progreso y el countdown */
  active?: boolean;
  /** Fracción 0→1 del progreso */
  progress?: number;
  /** Segundos restantes para mostrar en el label */
  countdown?: number | null;
  className?: string;
}

export function ContinueButton({
  onClick,
  active = false,
  progress = 0,
  countdown = null,
  className,
}: ContinueButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn('relative overflow-hidden min-w-36', className)}
    >
      {/* Barra de progreso que avanza de izquierda a derecha */}
      {active && (
        <span
          className="pointer-events-none absolute inset-0 bg-white/20 origin-left transition-transform duration-1000 ease-linear"
          style={{ transform: `scaleX(${progress})` }}
        />
      )}

      <span className="relative flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {active && countdown !== null && countdown > 0
          ? `Continuar (${countdown}s)`
          : 'Continuar'}
      </span>
    </Button>
  );
}
