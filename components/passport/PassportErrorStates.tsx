'use client';

import { AlertCircle, Award, RefreshCw, WifiOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PassportError } from '@/modules/passport';

interface PassportErrorStateProps {
  error: PassportError;
  onRetry?: () => void;
}

/**
 * Estado: Pasaporte no disponible (5xx, servicio caído).
 */
function PassportUnavailableState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-error-200 bg-error-50 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-error-100 flex items-center justify-center mb-4">
        <Award className="w-6 h-6 text-error-600" />
      </div>
      <h3 className="text-base font-semibold text-error-900">
        No pudimos cargar tu pasaporte
      </h3>
      <p className="text-sm text-error-700 mt-2 max-w-sm">
        El servicio no está disponible en este momento. Tu progreso está seguro, intenta nuevamente.
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4 gap-2 border-error-300 text-error-700 hover:bg-error-100"
          onClick={onRetry}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

/**
 * Estado: Error de red (sin conexión, timeout).
 */
function PassportNetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-error-200 bg-error-50 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-error-100 flex items-center justify-center mb-4">
        <WifiOff className="w-6 h-6 text-error-600" />
      </div>
      <h3 className="text-base font-semibold text-error-900">
        Sin conexión
      </h3>
      <p className="text-sm text-error-700 mt-2 max-w-sm">
        Verifica tu internet e intenta nuevamente. Tu pasaporte y puntos están seguros.
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4 gap-2 border-error-300 text-error-700 hover:bg-error-100"
          onClick={onRetry}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

/**
 * Estado: Sesión expirada.
 */
function PassportSessionExpiredState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <LogIn className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        Sesión expirada
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Tu sesión expiró. Vuelve a iniciar sesión para ver tu pasaporte financiero.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="mt-4 gap-2"
        onClick={() => window.location.href = '/api/logto/sign-in'}
      >
        <LogIn className="w-3.5 h-3.5" />
        Iniciar sesión
      </Button>
    </div>
  );
}

/**
 * Estado: Error del servidor (genérico).
 */
function PassportServerErrorState({ error, onRetry }: PassportErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        Algo salió mal
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        {error.message}
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
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

/**
 * Router de errores del pasaporte.
 * Recibe el error del service y muestra el componente adecuado según el código.
 */
export function PassportErrorRouter({ error, onRetry }: PassportErrorStateProps) {
  switch (error.code) {
    case 'PASSPORT_UNAVAILABLE':
    case 'HISTORY_UNAVAILABLE':
      return <PassportUnavailableState onRetry={onRetry} />;

    case 'NETWORK_ERROR':
      return <PassportNetworkErrorState onRetry={onRetry} />;

    case 'SESSION_EXPIRED':
      return <PassportSessionExpiredState />;

    case 'SERVER_ERROR':
    default:
      return <PassportServerErrorState error={error} onRetry={onRetry} />;
  }
}
