// ─── KYC ─────────────────────────────────────────────────────────────────────

import type { FormEditMetadata } from './form-edit-policy';

export type KycStatus = 'VERIFIED' | 'EXPIRED' | 'REPLACED' | 'PENDING';

export interface KYCData {
  dni: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  verificationCode: string;
  birth_date: string;
  status?: KycStatus;
  /** @deprecated usar status === 'VERIFIED' */
  verified?: boolean;
  /** Metadatos de edición (permisos y políticas) */
  editMetadata?: FormEditMetadata;
}
