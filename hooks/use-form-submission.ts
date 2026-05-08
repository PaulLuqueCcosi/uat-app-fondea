'use client';

import { useState } from 'react';
import type { ActionResult, ErrorCategory } from '@/lib/types';

/**
 * Hook que encapsula el patrón de submit de formularios del funnel.
 *
 * Maneja: isVerified, isEditing, saveError, saveErrorCategory, savedData.
 * Elimina ~50 líneas repetidas en cada formulario.
 *
 * @param saveAction - Server action que guarda los datos (debe devolver ActionResult)
 * @param options.initialVerified - Si el perfil ya está verificado al montar
 * @param options.initialData - Datos guardados previamente (para la vista readonly)
 * @param options.onSuccess - Callback después de guardar exitosamente
 *
 * @example
 * const { isVerified, isEditing, saveError, saveErrorCategory, savedData, handleSubmit, startEditing, clearError } =
 *   useFormSubmission(saveEconomicProfile, {
 *     initialVerified: initialData?.overall_verified,
 *     initialData: initialData?.profile,
 *   });
 */
export function useFormSubmission<TData, TSubmit = TData>(
  saveAction: (data: TSubmit) => Promise<ActionResult>,
  options: {
    initialVerified?: boolean;
    initialData?: TData | null;
    onSuccess?: (data: TSubmit) => void;
  } = {},
) {
  const { initialVerified = false, initialData = null, onSuccess } = options;

  const [isVerified, setIsVerified] = useState(initialVerified);
  const [isEditing, setIsEditing] = useState(!initialVerified);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorCategory, setSaveErrorCategory] = useState<ErrorCategory | undefined>(undefined);
  const [savedData, setSavedData] = useState<TData | null>(initialData);

  const handleSubmit = async (data: TSubmit): Promise<boolean> => {
    setSaveError(null);
    setSaveErrorCategory(undefined);

    try {
      const result = await saveAction(data);

      if (!result.success) {
        setSaveError(result.error);
        setSaveErrorCategory(result.errorCategory);
        return false;
      }

      // Guardar los datos para la vista readonly
      setSavedData(data as unknown as TData);
      setIsVerified(true);
      setIsEditing(false);
      onSuccess?.(data);
      return true;
    } catch {
      setSaveError('Error de conexión. Por favor, inténtalo nuevamente.');
      setSaveErrorCategory('network');
      return false;
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setSaveError(null);
    setSaveErrorCategory(undefined);
  };

  /** Cancela la edición y vuelve a la vista readonly (solo si ya guardó antes) */
  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
    setSaveErrorCategory(undefined);
  };

  const clearError = () => {
    setSaveError(null);
    setSaveErrorCategory(undefined);
  };

  return {
    /** Ya guardó al menos una vez */
    isVerified,
    /** Está en modo formulario (editando o primera vez) */
    isEditing,
    /** true = primera vez llenando, false = editando algo ya guardado */
    isFirstTime: isEditing && !isVerified,
    saveError,
    saveErrorCategory,
    savedData,
    handleSubmit,
    startEditing,
    cancelEditing,
    clearError,
  };
}
