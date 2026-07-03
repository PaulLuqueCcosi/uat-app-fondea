'use client';

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { ErrorCategory } from '@/lib/types';

// ─── Configuración global ────────────────────────────────────────────────────
// Modifica estos valores para cambiar el comportamiento de TODOS los formularios.
// Si tu cliente dice "no quiero banner, solo toast" → pon showBanner: false.
// Si dice "no quiero ver intentos" → pon showAttempts: false.

export const FORM_ERROR_CONFIG = {
  /** Mostrar el SaveErrorBanner inline en el formulario */
  showBanner: false,
  /** Mostrar un toast cuando hay error de submit */
  showToastOnError: true,
  /** Mostrar la barra de intentos restantes */
  showAttempts: false,
  /** Mostrar el panel de bloqueo por rate limit */
  showBlockedPanel: false,
  /** Mostrar toast de loading mientras se guarda */
  showToastLoading: true,
  /** Mostrar toast de éxito al guardar */
  showToastSuccess: true,
  /** Mensajes por categoría de error — lo que ve el usuario en el toast */
  messages: {
    validation: 'Los datos ingresados no son válidos. Revisa e intenta nuevamente.',
    auth: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    not_found: 'No se encontró el recurso solicitado.',
    conflict: 'Esta operación no se puede realizar ahora.',
    rate_limit: 'Demasiados intentos. Intenta más tarde.',
    server: 'Error del servidor. Intenta en unos minutos.',
    network: 'Error de conexión. Verifica tu internet.',
    unknown: 'Ocurrió un error inesperado. Intenta nuevamente.',
  } satisfies Record<ErrorCategory, string>,
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Resultado que devuelve una server action cuando falla */
export interface FormActionError {
  success: false;
  error: string;
  errorCategory?: ErrorCategory;
  httpStatus?: number;
  /** Rate limit: módulo bloqueado */
  blockedHoursLeft?: number;
  /** Intentos restantes (422 / rate limit) */
  attemptsLeft?: number;
  maxAttempts?: number;
  /** Acción especial requerida (ej: 're-login' en KYC) */
  action?: string;
}

export interface FormActionSuccess {
  success: true;
  [key: string]: unknown;
}

export type FormActionResult = FormActionSuccess | FormActionError;

export interface FormErrorState {
  /** Mensaje de error para mostrar al usuario */
  error: string | null;
  /** Categoría para decidir estilo del banner */
  errorCategory: ErrorCategory | undefined;
  /** Si el módulo está bloqueado por rate limit */
  blocked: boolean;
  /** Horas restantes del bloqueo */
  blockedHoursLeft: number;
  /** Intentos restantes (solo si config.showAttempts) */
  attemptsLeft: number | undefined;
  /** Max intentos (solo si config.showAttempts) */
  maxAttempts: number | undefined;
  /** Acción especial requerida (ej: 're-login') */
  specialAction: string | null;
}

export interface UseFormErrorHandlerOptions {
  /** Nombre del módulo para los mensajes de toast (ej: "Perfil laboral") */
  moduleName: string;
  /** Si es dashboardMode, no muestra toast de loading */
  dashboardMode?: boolean;
  /** Override de la config global para este formulario específico */
  config?: Partial<typeof FORM_ERROR_CONFIG>;
}

export interface UseFormErrorHandlerReturn {
  /** Estado actual de errores */
  state: FormErrorState;
  /** Ejecuta una acción y maneja errores automáticamente. Retorna el resultado si fue exitoso, null si falló. */
  execute: <T extends FormActionResult>(
    action: () => Promise<T>,
    successMessage?: string,
  ) => Promise<(T & { success: true }) | null>;
  /** Limpia todos los estados de error */
  clear: () => void;
  /** Si se debe renderizar el banner de error */
  shouldShowBanner: boolean;
  /** Si se debe renderizar el panel de bloqueo */
  shouldShowBlocked: boolean;
  /** Si se debe renderizar los intentos restantes */
  shouldShowAttempts: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFormErrorHandler(
  options: UseFormErrorHandlerOptions
): UseFormErrorHandlerReturn {
  const { moduleName, dashboardMode = false, config: overrides } = options;

  // Merge config global con overrides del formulario
  const config = useMemo(
    () => ({ ...FORM_ERROR_CONFIG, ...overrides }),
    [overrides]
  );

  const [state, setState] = useState<FormErrorState>({
    error: null,
    errorCategory: undefined,
    blocked: false,
    blockedHoursLeft: 0,
    attemptsLeft: undefined,
    maxAttempts: undefined,
    specialAction: null,
  });

  const clear = useCallback(() => {
    setState({
      error: null,
      errorCategory: undefined,
      blocked: false,
      blockedHoursLeft: 0,
      attemptsLeft: undefined,
      maxAttempts: undefined,
      specialAction: null,
    });
  }, []);

  const execute = useCallback(
    async <T extends FormActionResult>(
      action: () => Promise<T>,
      successMessage?: string,
    ): Promise<(T & { success: true }) | null> => {
      // Limpiar estado previo
      setState((prev) => ({
        ...prev,
        error: null,
        errorCategory: undefined,
        specialAction: null,
      }));

      // Toast de loading
      const toastId =
        config.showToastLoading && !dashboardMode
          ? toast.loading(`Guardando ${moduleName.toLowerCase()}...`)
          : undefined;

      try {
        const result = await action();

        if (!result.success) {
          const errorResult = result as FormActionError;
          const category = errorResult.errorCategory ?? 'unknown';
          const message = errorResult.error || config.messages[category];

          // Toast de error
          if (config.showToastOnError) {
            if (toastId) {
              toast.error(message, { id: toastId });
            } else {
              toast.error(message);
            }
          } else if (toastId) {
            toast.dismiss(toastId);
          }

          // Toast warning de último intento
          if (errorResult.attemptsLeft === 1) {
            toast.warning(
              'Este es tu último intento. Si falla, tu cuenta se bloqueará por 24 horas.',
              { duration: 8000 },
            );
          }

          // Actualizar estado
          setState((prev) => ({
            ...prev,
            error: message,
            errorCategory: category,
            blocked: category === 'rate_limit' ? true : prev.blocked,
            blockedHoursLeft:
              category === 'rate_limit'
                ? errorResult.blockedHoursLeft ?? 24
                : prev.blockedHoursLeft,
            attemptsLeft: errorResult.attemptsLeft ?? prev.attemptsLeft,
            maxAttempts: errorResult.maxAttempts ?? prev.maxAttempts,
            specialAction: errorResult.action ?? null,
          }));

          return null;
        }

        // Éxito
        if (config.showToastSuccess && !dashboardMode) {
          const msg = successMessage ?? `${moduleName} guardado`;
          if (toastId) {
            toast.success(msg, { id: toastId });
          } else {
            toast.success(msg);
          }
        } else if (toastId) {
          toast.dismiss(toastId);
        }

        return result as T & { success: true };
      } catch {
        const message = config.messages.network;

        if (config.showToastOnError) {
          if (toastId) {
            toast.error(message, { id: toastId });
          } else {
            toast.error(message);
          }
        } else if (toastId) {
          toast.dismiss(toastId);
        }

        setState((prev) => ({
          ...prev,
          error: message,
          errorCategory: 'network',
        }));

        return null;
      }
    },
    [config, dashboardMode, moduleName]
  );

  const shouldShowBanner = config.showBanner && state.error !== null;
  const shouldShowBlocked = config.showBlockedPanel && state.blocked;
  const shouldShowAttempts =
    config.showAttempts &&
    state.attemptsLeft !== undefined &&
    state.attemptsLeft > 0;

  return {
    state,
    execute,
    clear,
    shouldShowBanner,
    shouldShowBlocked,
    shouldShowAttempts,
  };
}
