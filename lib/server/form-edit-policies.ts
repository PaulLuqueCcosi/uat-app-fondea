/**
 * Configuración centralizada de políticas de edición de formularios.
 *
 * - editable: true  → botón "Editar" visible
 * - editable: false → sin botón, no se puede editar
 * - policy: ALWAYS_EDITABLE   → edita y guarda sin modal
 * - policy: CONFIRM_REQUIRED  → muestra modal de confirmación al guardar
 *
 * IMPORTANTE: Este archivo es SERVER-ONLY (no se envía al cliente).
 */

import type { FormEditPolicy, FormEditMetadata, FormModuleType } from '@/lib/types/form-edit-policy';

interface PolicyConfig {
  editable: boolean;
  policy: FormEditPolicy;
}

const EDIT_POLICIES: Record<FormModuleType, PolicyConfig> = {
  // ── KYC ────────────────────────────────────────────────────────────────────
  kyc: {
    editable: true,
    policy: 'CONFIRM_REQUIRED',
  },

  kyc_documents: {
    editable: true,
    policy: 'ALWAYS_EDITABLE',
  },

  kyc_selfie: {
    editable: true,
    policy: 'ALWAYS_EDITABLE',
  },

  // ── PERFIL LABORAL ─────────────────────────────────────────────────────────
  labor: {
    editable: true,
    policy: 'CONFIRM_REQUIRED',
  },

  // ── PERFIL ECONÓMICO ───────────────────────────────────────────────────────
  economic: {
    editable: true,
    policy: 'CONFIRM_REQUIRED',
  },

  // ── DIRECCIÓN ──────────────────────────────────────────────────────────────
  address: {
    editable: true,
    policy: 'CONFIRM_REQUIRED',
  },

  // ── CUENTA BANCARIA ────────────────────────────────────────────────────────
  bank_account: {
    editable: true,
    policy: 'CONFIRM_REQUIRED',
  },

  // ── REFERENCIAS ────────────────────────────────────────────────────────────
  references: {
    editable: true,
    policy: 'ALWAYS_EDITABLE',
  },
};

/**
 * Calcula los metadatos de edición para un módulo específico.
 */
export function getEditMetadata(
  module: FormModuleType,
  isVerified: boolean
): FormEditMetadata {
  const config = EDIT_POLICIES[module];

  // Si no está verificado, siempre es editable sin modal
  if (!isVerified) {
    return {
      overall_verified: false,
      editable: true,
      edit_policy: 'ALWAYS_EDITABLE',
    };
  }

  return {
    overall_verified: true,
    editable: config.editable,
    edit_policy: config.policy,
  };
}

/**
 * Helper rápido para validaciones server-side.
 */
export function canEditModule(
  module: FormModuleType,
  isVerified: boolean
): boolean {
  if (!isVerified) return true;
  return EDIT_POLICIES[module].editable;
}
