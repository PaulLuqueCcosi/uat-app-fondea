'use client';

import { AlertCircle, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EducationError } from '@/modules/education';

interface EducationErrorStateProps {
  error: EducationError;
  onRetry?: () => void;
}

/**
 * Estado: No hay módulos (base de datos vacía o data source sin contenido).
 *
 * Este es un estado válido — no es un error técnico, es que simplemente
 * no hay contenido aún. Muestra un mensaje amigable.
 */
export function EducationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookOpen className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        No hay módulos disponibles
      </h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Pronto tendremos contenido educativo nuevo. Vuelve más tarde para aprender
        sobre finanzas personales con FONDEA.
      </p>
    </div>
  );
}

/**
 * Estado: Servidor no disponible (5xx, timeout, CMS inaccesible).
 *
 * El servidor no responde o algo falló del lado del servidor.
 * Muestra opción de reintentar.
 */
export function EducationServerErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-error-200 bg-error-50 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-error-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-error-600" />
      </div>
      <h3 className="text-base font-semibold text-error-900">
        Servicio no disponible
      </h3>
      <p className="text-sm text-error-700 mt-2 max-w-sm">
        No pudimos cargar el contenido educativo en este momento. Por favor,
        intenta más tarde.
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
 * Estado: Servidor no disponible - CMS offline, DNS fail, etc.
 *
 * Similar a SERVER_ERROR pero con más detalles sobre disponibilidad.
 * Reutilizamos este visual también para problemas de red que afecten al CMS.
 */
export function EducationNetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-error-200 bg-error-50 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-error-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-error-600" />
      </div>
      <h3 className="text-base font-semibold text-error-900">
        No pudimos conectar
      </h3>
      <p className="text-sm text-error-700 mt-2 max-w-sm">
        El servidor de contenido no está disponible. Por favor, intenta más tarde.
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
 * Estado: Data inválida o corrupta en la fuente.
 *
 * El servidor respondió pero la data no es válida (faltan campos, formato incorrecto).
 * Raro en producción, pero puede pasar si el CMS tiene problemas.
 */
export function EducationInvalidDataState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-error-200 bg-error-50 py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-error-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-error-600" />
      </div>
      <h3 className="text-base font-semibold text-error-900">
        Error al procesar datos
      </h3>
      <p className="text-sm text-error-700 mt-2 max-w-sm">
        El contenido tiene un formato incorrecto. Por favor, contacta a soporte
        si el problema persiste.
      </p>
    </div>
  );
}

/**
 * Estado: Error desconocido o no controlado.
 *
 * Fallback para cualquier error que no hayamos anticipado.
 * Útil para capturar bugs o situaciones inesperadas.
 */
export function EducationUnknownErrorState({ error, onRetry }: EducationErrorStateProps) {
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
      {error.cause && (
        <p className="text-xs text-muted-foreground mt-4 font-mono bg-muted px-2 py-1 rounded max-w-xs wrap-break-word">
          [{error.code}] {error.cause}
        </p>
      )}
    </div>
  );
}

/**
 * Router automático: recibe el error y muestra el componente adecuado.
 *
 * Usa esta función en la page si quieres dejar que el componente
 * maneje el routing de errores automáticamente.
 */
export function EducationErrorRouter({
  error,
  onRetry,
}: EducationErrorStateProps) {
  switch (error.code) {
    case 'MODULES_EMPTY':
      return <EducationEmptyState />;

    case 'CMS_UNAVAILABLE':
      return <EducationServerErrorState onRetry={onRetry} />;

    case 'INVALID_MODULE_DATA':
      return <EducationInvalidDataState />;

    case 'MODULE_NOT_FOUND':
      // Este solo aparece en la page de detalle, no en la lista
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 py-12 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Módulo no encontrado
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message}
          </p>
        </div>
      );

    // Fallback para cualquier código que no anticipamos
    // (no debería ocurrir si los tipos están en sync)
    default:
      return <EducationUnknownErrorState error={error} onRetry={onRetry} />;
  }
}
