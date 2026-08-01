/**
 * Configuración centralizada de políticas de edición de formularios.
 *
 * Flujo:
 * 1. Intenta leer del backend: GET /api/v1/config/form-edit-policies
 * 2. Si no existe (404) o falla → usa DEFAULT_EDIT_POLICIES (fallback local)
 * 3. La policy siempre es CONFIRM_REQUIRED para verificados (hardcoded)
 *
 * El backend guarda solo el booleano `editable` por módulo:
 * { "kyc": true, "labor": true, "economic": false, ... }
 *
 * IMPORTANTE: Este archivo es SERVER-ONLY (no se envía al cliente).
 */

import type { FormEditMetadata, FormModuleType } from '@/lib/types/form-edit-policy';
import { backendFetch } from '@/lib/backend-fetch';

// ── Módulos que soportan edit-policy ─────────────────────────────────────────

type EditableModuleType = Exclude<FormModuleType, 'kyc_documents' | 'kyc_selfie'>;

// ── Default local (fallback si backend no tiene la config) ───────────────────

const DEFAULT_EDIT_POLICIES: Record<EditableModuleType, boolean> = {
  kyc: true,
  labor: true,
  economic: true,
  address: true,
  bank_account: true,
  references: true,
};

// ── Cache en memoria (dura el lifetime del request / server action) ───────────

let cachedPolicies: Record<string, boolean> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minuto

/**
 * Obtiene las políticas de edición del backend.
 * Cachea por 1 minuto para no hacer fetch en cada llamada dentro del mismo request.
 */
async function fetchEditPolicies(): Promise<Record<string, boolean>> {
  const now = Date.now();
  if (cachedPolicies && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedPolicies;
  }

  try {
    const res = await backendFetch('/api/v1/config/form-edit-policies', {
      context: 'EDIT_POLICIES',
    });

    if (!res.ok) {
      // 404 = no existe la config → usar defaults
      if (res.status === 404) {
        console.log('[EDIT_POLICIES] Config no encontrada en backend — usando defaults');
      } else {
        console.warn('[EDIT_POLICIES] Error al obtener config:', res.status);
      }
      return DEFAULT_EDIT_POLICIES;
    }

    const json = await res.json();
    // El backend devuelve: { config_key, value: "{ json string }" }
    const parsed = typeof json.value === 'string' ? JSON.parse(json.value) : json.value;

    cachedPolicies = parsed;
    cacheTimestamp = now;
    return parsed;
  } catch (error) {
    console.warn('[EDIT_POLICIES] Error de conexión — usando defaults:', error);
    return DEFAULT_EDIT_POLICIES;
  }
}

/**
 * Calcula los metadatos de edición para un módulo específico.
 */
export async function getEditMetadata(
  module: FormModuleType,
  isVerified: boolean
): Promise<FormEditMetadata> {
  // Si no está verificado, siempre es editable sin modal
  if (!isVerified) {
    return {
      overall_verified: false,
      editable: true,
      edit_policy: 'ALWAYS_EDITABLE',
    };
  }

  // kyc_documents y kyc_selfie siempre editables (no pasan por backend config)
  if (module === 'kyc_documents' || module === 'kyc_selfie') {
    return {
      overall_verified: true,
      editable: true,
      edit_policy: 'ALWAYS_EDITABLE',
    };
  }

  const policies = await fetchEditPolicies();
  const editable = policies[module] ?? DEFAULT_EDIT_POLICIES[module as EditableModuleType] ?? true;

  return {
    overall_verified: true,
    editable,
    edit_policy: 'CONFIRM_REQUIRED',
  };
}

/**
 * Helper rápido para validaciones server-side.
 */
export async function canEditModule(
  module: FormModuleType,
  isVerified: boolean
): Promise<boolean> {
  if (!isVerified) return true;
  if (module === 'kyc_documents' || module === 'kyc_selfie') return true;

  const policies = await fetchEditPolicies();
  return policies[module] ?? DEFAULT_EDIT_POLICIES[module as EditableModuleType] ?? true;
}
