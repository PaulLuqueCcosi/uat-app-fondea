'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

type AlertBannerVariant = 'warning' | 'error' | 'info';

interface AlertBannerProps {
  variant: AlertBannerVariant;
  title: string;
  description?: string;
  attemptsLeft?: number;
  maxAttempts?: number;
  blockedHoursLeft?: number;
  className?: string;
}

const variantConfig = {
  warning: {
    containerClass: 'border-amber-200 bg-amber-50/50',
    iconBgClass: 'bg-amber-100',
    iconClass: 'text-amber-700',
    titleClass: 'text-amber-900',
    descClass: 'text-amber-800',
    icon: Clock,
  },
  error: {
    containerClass: 'border-red-200 bg-red-50/50',
    iconBgClass: 'bg-red-100',
    iconClass: 'text-red-700',
    titleClass: 'text-red-900',
    descClass: 'text-red-800',
    icon: XCircle,
  },
  info: {
    containerClass: 'border-blue-200 bg-blue-50/50',
    iconBgClass: 'bg-blue-100',
    iconClass: 'text-blue-700',
    titleClass: 'text-blue-900',
    descClass: 'text-blue-800',
    icon: AlertTriangle,
  },
};

export function AlertBanner({
  variant,
  title,
  description,
  attemptsLeft,
  maxAttempts,
  blockedHoursLeft,
  className,
}: AlertBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border p-4', config.containerClass, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', config.iconBgClass)}>
          <Icon className={cn('w-4 h-4', config.iconClass)} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className={cn('text-sm font-semibold', config.titleClass)}>{title}</p>
          {description && (
            <p className={cn('text-sm leading-relaxed', config.descClass)}>{description}</p>
          )}

          {/* Barra de intentos restantes */}
          {attemptsLeft !== undefined && maxAttempts !== undefined && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className={cn('font-medium', config.descClass)}>Intentos restantes</span>
                <span className={cn('font-bold', config.titleClass)}>
                  {attemptsLeft} de {maxAttempts}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    attemptsLeft === 1 ? 'bg-red-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${((maxAttempts - attemptsLeft) / maxAttempts) * 100}%` }}
                />
              </div>
              {attemptsLeft === 1 && (
                <p className="text-xs font-semibold text-red-700">
                  Último intento — si falla, tu cuenta quedará bloqueada por 24 horas
                </p>
              )}
            </div>
          )}

          {/* Bloqueo por horas */}
          {blockedHoursLeft !== undefined && blockedHoursLeft > 0 && (
            <p className="text-xs text-amber-700 pt-1">
              Podrás intentarlo nuevamente en {blockedHoursLeft} hora{blockedHoursLeft !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}