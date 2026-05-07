import type { ReferralSource } from './common';

// ─── Address / Additional ────────────────────────────────────────────────────

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
}

export interface AddressProfileStatus {
  profile: (AddressProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}
