// ─── Auth & User ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dni?: string;
  profileProgress?: number;
  sections?: ProfileSections;
}

export interface ProfileSections {
  kyc: SectionStatus;
  labor: SectionStatus;
  economic: SectionStatus;
  references: SectionStatus;
  additional: SectionStatus;
}

export type SectionStatus = 'pending' | 'completed' | 'in_progress';
