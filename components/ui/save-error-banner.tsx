'use client';

import { AlertTriangle, WifiOff, ShieldAlert, ServerCrash, RefreshCw } from 'lucide-react';
import type { ErrorCategory } from '@/lib/types';

interface SaveErrorBannerProps {
  error: string;
  errorCategory?: ErrorCategory;
  /** Muestra botón "Reintentar" y llama a este callback */
  onRetry?: () => void;
}

const CONFIG: Record<
  ErrorCategory,
  { icon: React.ElementType; bg: string; border: string; text: string; title: string }
> = {
  validation: {
    icon: AlertTriangle,
    bg: 'bg-warning-50 dark:bg-warning-900/30',
    border: 'border-warning-100 dark:border-warning-700',
    text: 'text-warning-700 dark:text-warning-400',
    title: 'Datos inválidos',
  },
  auth: {
    icon: ShieldAlert,
    bg: 'bg-error-50 dark:bg-error-900/30',
    border: 'border-error-100 dark:border-error-700',
    text: 'text-error-700 dark:text-error-300',
    title: 'Sesión expirada',
  },
  not_found: {
    icon: AlertTriangle,
    bg: 'bg-warning-50 dark:bg-warning-900/30',
    border: 'border-warning-100 dark:border-warning-700',
    text: 'text-warning-700 dark:text-warning-400',
    title: 'No encontrado',
  },
  conflict: {
    icon: AlertTriangle,
    bg: 'bg-warning-50 dark:bg-warning-900/30',
    border: 'border-warning-100 dark:border-warning-700',
    text: 'text-warning-700 dark:text-warning-400',
    title: 'Conflicto',
  },
  rate_limit: {
    icon: ShieldAlert,
    bg: 'bg-warning-50 dark:bg-warning-900/30',
    border: 'border-warning-100 dark:border-warning-700',
    text: 'text-warning-700 dark:text-warning-400',
    title: 'Demasiados intentos',
  },
  server: {
    icon: ServerCrash,
    bg: 'bg-error-50 dark:bg-error-900/30',
    border: 'border-error-100 dark:border-error-700',
    text: 'text-error-700 dark:text-error-300',
    title: 'Error del servidor',
  },
  network: {
    icon: WifiOff,
    bg: 'bg-neutral-50 dark:bg-neutral-900/50',
    border: 'border-neutral-200 dark:border-neutral-700',
    text: 'text-neutral-700 dark:text-neutral-300',
    title: 'Sin conexión',
  },
  unknown: {
    icon: AlertTriangle,
    bg: 'bg-error-50 dark:bg-error-900/30',
    border: 'border-error-100 dark:border-error-700',
    text: 'text-error-700 dark:text-error-300',
    title: 'Error inesperado',
  },
};

export function SaveErrorBanner({ error, errorCategory, onRetry }: SaveErrorBannerProps) {
  const cfg = CONFIG[errorCategory ?? 'unknown'];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.text}`} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.title}</p>
        <p className={`text-sm mt-0.5 ${cfg.text} opacity-90`}>{error}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`shrink-0 flex items-center gap-1.5 text-xs font-medium underline-offset-2 hover:underline ${cfg.text}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      )}
    </div>
  );
}
