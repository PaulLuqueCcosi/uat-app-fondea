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
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    title: 'Datos inválidos',
  },
  auth: {
    icon: ShieldAlert,
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    title: 'Sesión expirada',
  },
  not_found: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    title: 'No encontrado',
  },
  conflict: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    title: 'Conflicto',
  },
  rate_limit: {
    icon: ShieldAlert,
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-300',
    title: 'Demasiados intentos',
  },
  server: {
    icon: ServerCrash,
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    title: 'Error del servidor',
  },
  network: {
    icon: WifiOff,
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    title: 'Sin conexión',
  },
  unknown: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
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
