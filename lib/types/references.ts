// ─── References ──────────────────────────────────────────────────────────────

import type { FormEditMetadata } from './form-edit-policy';

export type ReferencesStatus = 'VERIFIED' | 'EXPIRED' | 'REPLACED' | 'PENDING';

export interface Reference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  yearsKnown?: number;
}

export interface ReferencesData {
  references: Reference[];
}

export type FamilyRelationship =
  | 'MADRE'
  | 'PADRE'
  | 'HERMANO'
  | 'HIJO'
  | 'CONYUGE'
  | 'TIO'
  | 'PRIMO'
  | 'ABUELO'
  | 'OTRO';

export type NonFamilyRelationship =
  | 'COLEGA'
  | 'AMIGO'
  | 'VECINO'
  | 'CONOCIDO'
  | 'OTRO';

export type YearsKnownRange =
  | 'MENOS_DE_1_ANIO'
  | 'DE_1_A_3_ANIOS'
  | 'MAS_DE_3_ANIOS';

export interface ReferencesProfile {
  family_reference: {
    name: string;
    phone: string;
    relationship: FamilyRelationship;
    relationship_other?: string;
  };
  non_family_reference: {
    name: string;
    phone: string;
    relationship: NonFamilyRelationship;
    relationship_other?: string;
    years_known: YearsKnownRange;
  };
  verified?: boolean;
}

export interface ReferencesProfileStatus {
  profile: (ReferencesProfile & { verified: boolean }) | null;
  overall_verified: boolean;
  /** Estado del backend (VERIFIED, EXPIRED, REPLACED, PENDING) */
  status?: ReferencesStatus;
  /** Metadatos de edición (permisos y políticas) */
  editMetadata?: FormEditMetadata;
}
