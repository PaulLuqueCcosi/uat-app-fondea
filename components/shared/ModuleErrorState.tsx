'use client';

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ModuleError } from '@/modules/shared/result';

interface ModuleErrorStateProps {
  error: ModuleError;
  title?: string;
  onRetry?: () => void;
}

/**
 * Estado de error genérico para módulos.
 *
 * Muestra un mensaje amigable al usuario con opción de reintentar.
 * Hace pattern matching por error.code para elegir icono adecuado.
 */
export function ModuleErrorState({ error, title, onRetry }: ModuleErrorStateProps) {
  const isNetwork = error.code === 'NETWORK_ERROR';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        {isNetwork ? (
          <WifiOff className="w-5 h-5 text-muted-foreground" />
        ) : (
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-sm font-medium text-foreground">
        {title ?? (isNetwork ? 'Sin conexión' : 'Algo salió mal')}
      </h3>

      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
        {error.message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
