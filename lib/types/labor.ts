// ─── Labor ───────────────────────────────────────────────────────────────────

export type EmploymentStatus =
  | 'EMPLEADO_DEPENDIENTE'
  | 'INDEPENDIENTE'
  | 'EMPRESARIO'
  | 'FREELANCE';

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
  years_of_activity?: number;
  business_ruc?: string;
  verified?: boolean;
}

export interface LaborDetailsEmpleado {
  industry: LaborIndustry;
  years_of_activity: number;
}

export interface LaborDetailsIndependiente {
  industry: LaborIndustry;
  years_of_activity: number;
}

export interface LaborDetailsFreelance {
  industry: LaborIndustry;
  years_of_activity: number;
}

export interface LaborDetailsEmpresario {
  industry: LaborIndustry;
  years_of_activity: number;
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
}

export interface LaborData {
  situation?: LaborSituation;
  details?: LaborDetails;
  income?: LaborIncome;
  overall_verified?: boolean;
}
