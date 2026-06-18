'use client';

import { Separator } from '@/components/ui/separator';
import { SaveErrorBanner } from '@/components/ui/save-error-banner';
import { AlertBanner } from '@/components/ui/alert-banner';
import type { UseFormErrorHandlerReturn } from '@/hooks/use-form-error-handler';

interface FormErrorFeedbackProps {
  /** El return de useFormErrorHandler() */
  handler: UseFormErrorHandlerReturn;
  /** Callback para reintentar (opcional) */
  onRetry?: () => void;
  /** Clase adicional para el wrapper */
  className?: string;
}

/**
 * Componente que renderiza TODA la UI de errores de un formulario:
 * - Banner de error (SaveErrorBanner)
 * - Panel de bloqueo (AlertBanner variant="error")
 * - Intentos restantes (AlertBanner variant="warning")
 *
 * Se controla desde la config global en `use-form-error-handler.ts`.
 * Si la config dice showBanner: false, no renderiza nada.
 * Úsalo en todos los formularios para garantizar homogeneidad.
 */
export function FormErrorFeedback({ handler, onRetry, className }: FormErrorFeedbackProps) {
  const { state, shouldShowBanner, shouldShowBlocked, shouldShowAttempts } = handler;

  // Nada que mostrar
  if (!shouldShowBanner && !shouldShowBlocked && !shouldShowAttempts) {
    return null;
  }

  return (
    <div className={className}>
      {/* Banner de error principal */}
      {shouldShowBanner && state.error && (
        <>
          <SaveErrorBanner
            error={state.error}
            errorCategory={state.errorCategory}
            onRetry={onRetry}
          />
          <Separator className="my-10 bg-primary/20 h-px" />
        </>
      )}

      {/* Panel de bloqueo por rate limit */}
      {shouldShowBlocked && (
        <>
          <AlertBanner
            variant="error"
            title={`Módulo bloqueado por ${state.blockedHoursLeft} hora${state.blockedHoursLeft !== 1 ? 's' : ''}`}
            description="Has superado el número máximo de intentos. Podrás intentarlo nuevamente cuando expire el bloqueo."
            blockedHoursLeft={state.blockedHoursLeft}
          />
          <Separator className="my-10 bg-primary/20 h-px" />
        </>
      )}

      {/* Intentos restantes */}
      {shouldShowAttempts && (
        <>
          <AlertBanner
            variant={state.attemptsLeft === 1 ? 'error' : 'warning'}
            title={state.attemptsLeft === 1 ? 'Último intento' : 'Intentos limitados'}
            description={`Te queda${state.attemptsLeft !== 1 ? 'n' : ''} ${state.attemptsLeft} intento${state.attemptsLeft !== 1 ? 's' : ''} de ${state.maxAttempts}.`}
            attemptsLeft={state.attemptsLeft}
            maxAttempts={state.maxAttempts}
          />
          <Separator className="my-10 bg-primary/20 h-px" />
        </>
      )}
    </div>
  );
}
