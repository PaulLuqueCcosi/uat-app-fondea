import type { ReferralSource } from './common';
import type { FormEditMetadata } from './form-edit-policy';

// ─── Address / Additional ────────────────────────────────────────────────────

export type AddressStatus = 'VERIFIED' | 'EXPIRED' | 'REPLACED' | 'PENDING';

export interface AdditionalData {
  address: string;
  district: string;
  city: string;
  department: string;
  housingType: 'own' | 'rent' | 'family' | 'mortgage' | 'other';
  yearsAtAddress: number;
  educationLevel: 'primary' | 'secondary' | 'technical' | 'university' | 'postgraduate';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'cohabiting';
  dependents: number;
  referral_source?: ReferralSource;
  referral_other?: string;
}

export interface AddressProfile {
  address_type: 'google' | 'manual';
  google_address?: string;
  street_address?: string;
  region: string;
  province: string;
  district: string;
  referral_source: string;
  referral_other?: string;
  verified?: boolean;
  location?: { lat: number; lng: number };
}

export interface AddressProfileStatus {
  profile: (AddressProfile & { verified: boolean }) | null;
  overall_verified: boolean;
  /** Estado del backend (VERIFIED, EXPIRED, REPLACED, PENDING) */
  status?: AddressStatus;
  /** Metadatos de edición (permisos y políticas) */
  editMetadata?: FormEditMetadata;
}
