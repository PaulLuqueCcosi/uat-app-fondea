// ─── Labor ───────────────────────────────────────────────────────────────────

import type { FormEditMetadata } from './form-edit-policy';

export type EmploymentStatus =
  | 'EMPLEADO_DEPENDIENTE'
  | 'INDEPENDIENTE'
  | 'EMPRESARIO'
  | 'FREELANCE'
  | 'DESEMPLEADO';

export type LaborStatus = 'VERIFIED' | 'EXPIRED' | 'REPLACED' | 'PENDING';

export type LaborIndustry =
  | 'TECNOLOGIA'
  | 'SALUD'
  | 'EDUCACION'
  | 'CONSTRUCCION'
  | 'COMERCIO'
  | 'SERVICIOS_PROFESIONALES'
  | 'OTRO';

export type AdditionalIncomeType =
  | 'ALQUILER'
  | 'DIVIDENDOS'
  | 'PENSION'
  | 'FREELANCE'
  | 'NEGOCIO_SECUNDARIO'
  | 'OTRO';

export type IncomeReceiptMethod =
  | 'CUENTA_BANCARIA'
  | 'EFECTIVO'
  | 'BILLETERA_DIGITAL'
  | 'OTROS';

export type YearsOfActivityRange =
  | 'MENOS_DE_6_MESES'
  | 'DE_6_A_12_MESES'
  | 'DE_1_A_3_ANIOS'
  | 'MAS_DE_3_ANIOS';

export interface AdditionalIncome {
  id: string;
  type: AdditionalIncomeType;
  custom_type?: string;
  amount: number;
  description?: string;
}

export interface LaborSituation {
  employment_status: EmploymentStatus;
  verified?: boolean;
}

export interface LaborDetails {
  industry: LaborIndustry;
  years_of_activity?: YearsOfActivityRange;
  business_ruc?: string;
  verified?: boolean;
}

export interface LaborDetailsEmpleado {
  industry: LaborIndustry;
  years_of_activity: YearsOfActivityRange;
}

export interface LaborDetailsIndependiente {
  industry: LaborIndustry;
  years_of_activity: YearsOfActivityRange;
}

export interface LaborDetailsFreelance {
  industry: LaborIndustry;
  years_of_activity: YearsOfActivityRange;
}

export interface LaborDetailsEmpresario {
  industry: LaborIndustry;
  years_of_activity: YearsOfActivityRange;
  business_ruc: string;
}

export type LaborDetailsByEmploymentStatus = {
  EMPLEADO_DEPENDIENTE: LaborDetailsEmpleado;
  INDEPENDIENTE:        LaborDetailsIndependiente;
  FREELANCE:            LaborDetailsFreelance;
  EMPRESARIO:           LaborDetailsEmpresario;
};

export type GetLaborDetailsType<T extends EmploymentStatus> = LaborDetailsByEmploymentStatus[T];

export interface LaborIncome {
  monthly_income: number;
  income_receipt_method?: IncomeReceiptMethod;
  has_additional_income: boolean;
  additional_incomes: AdditionalIncome[];
  verified?: boolean;
}

export interface LaborProfileStatus {
  situation: (LaborSituation & { verified: boolean }) | null;
  details: (LaborDetails & { verified: boolean }) | null;
  income: (LaborIncome & { verified: boolean }) | null;
  overall_verified: boolean;
  /** Estado del backend (VERIFIED, EXPIRED, REPLACED, PENDING) */
  status?: LaborStatus;
  /** Metadatos de edición (permisos y políticas) */
  editMetadata?: FormEditMetadata;
}

export interface LaborData {
  situation?: LaborSituation;
  details?: LaborDetails;
  income?: LaborIncome;
  overall_verified?: boolean;
}
