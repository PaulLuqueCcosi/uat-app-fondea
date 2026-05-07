// ─── KYC ─────────────────────────────────────────────────────────────────────

export interface KYCData {
  dni: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  verificationCode: string;
  birth_date: string;
  verified?: boolean;
}
