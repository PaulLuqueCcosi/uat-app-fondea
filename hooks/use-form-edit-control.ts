'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import type { FormEditPolicy, FormEditMetadata } from '@/lib/types/form-edit-policy';

export interface UseFormEditControlOptions {
  editMetadata?: FormEditMetadata;
  onEdit?: () => void | Promise<void>;
  onCancelEdit?: () => void;
  /** Se ejecuta cuando el usuario confirma en el modal (re-dispara submit) */
  onConfirmSubmit?: () => void;
}

export interface UseFormEditControlReturn {
  isReadOnly: boolean;
  isEditing: boolean;
  canEdit: boolean;
  isVerified: boolean;
  editPolicy: FormEditPolicy;

  requestEdit: () => void;
  cancelEdit: () => void;
  confirmSaved: () => void;
  /** Llama en onSubmit. Retorna false si se abrió modal (detener submit). */
  requestSubmit: () => boolean;

  dialogProps: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    policy: FormEditPolicy;
  };
}

/**
 * Hook de control de edición para formularios verificados.
 *
 * - editable=true  → botón "Editar" visible
 * - editable=false → sin botón
 * - ALWAYS_EDITABLE   → edita y guarda directo
 * - CONFIRM_REQUIRED  → muestra modal al guardar
 */
export function useFormEditControl(
  options: UseFormEditControlOptions = {}
): UseFormEditControlReturn {
  const { editMetadata, onEdit, onCancelEdit, onConfirmSubmit } = options;

  const isVerified = editMetadata?.overall_verified ?? false;
  const canEditBackend = editMetadata?.editable ?? true;
  const editPolicy = editMetadata?.edit_policy ?? 'ALWAYS_EDITABLE';

  const [isEditing, setIsEditing] = useState(!isVerified);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const confirmedRef = useRef(false);

  // Botón "Editar" visible solo si editable=true y está verificado
  const canEdit = useMemo(() => {
    if (!isVerified) return true;
    return canEditBackend;
  }, [isVerified, canEditBackend]);

  // Entrar en modo edición — siempre directo
  const requestEdit = useCallback(() => {
    if (!canEdit) return;
    setIsEditing(true);
    confirmedRef.current = false;
    onEdit?.();
  }, [canEdit, onEdit]);

  // Al hacer submit: si CONFIRM_REQUIRED y estaba verificado → modal
  const requestSubmit = useCallback((): boolean => {
    if (!isVerified) return true;
    if (confirmedRef.current) return true;
    if (editPolicy === 'CONFIRM_REQUIRED') {
      setShowConfirmDialog(true);
      return false;
    }
    return true;
  }, [isVerified, editPolicy]);

  // Usuario confirma en modal → re-dispara submit
  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmDialog(false);
    confirmedRef.current = true;
    onConfirmSubmit?.();
  }, [onConfirmSubmit]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setShowConfirmDialog(false);
    confirmedRef.current = false;
    onCancelEdit?.();
  }, [onCancelEdit]);

  const confirmSaved = useCallback(() => {
    setIsEditing(false);
    confirmedRef.current = false;
  }, []);

  return {
    isReadOnly: isVerified && !isEditing,
    isEditing,
    canEdit,
    isVerified,
    editPolicy,
    requestEdit,
    cancelEdit,
    confirmSaved,
    requestSubmit,
    dialogProps: {
      open: showConfirmDialog,
      onConfirm: handleConfirmSubmit,
      onCancel: () => setShowConfirmDialog(false),
      policy: editPolicy,
    },
  };
}
