// ─── Server Action Results ───────────────────────────────────────────────────

/**
 * Categorías de error que los server actions pueden devolver al cliente.
 * Permite que los formularios muestren mensajes diferenciados según el tipo.
 *
 * - validation  → 400 / 422: datos inválidos, el usuario puede corregirlos
 * - auth        → 401 / 403: sesión expirada o sin permisos
 * - not_found   → 404: el recurso no existe en el backend
 * - conflict    → 409: conflicto (ej: ya existe)
 * - rate_limit  → 429: demasiados intentos
 * - server      → 5xx: error interno del servidor
 * - network     → 0:   sin conexión / fetch lanzó excepción
 * - unknown     → cualquier otro código HTTP
 */
export type ErrorCategory =
  | 'validation'
  | 'auth'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'unknown';

/**
 * Resultado estándar que devuelven todos los server actions de escritura.
 * Reemplaza el antiguo `{ success: boolean; error?: string }`.
 */
export type ActionResult =
  | { success: true; httpStatus: number }
  | {
      success: false;
      httpStatus: number;       // 0 = sin conexión, >0 = código HTTP real
      errorCategory: ErrorCategory;
      error: string;            // mensaje listo para mostrar al usuario
    };

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

// ─── Loan / Funnel ───────────────────────────────────────────────────────────

export interface LoanSimulation {
  amount: number;
  months: number;
  monthlyPayment: number;
  monthlyRate: number;
  tea: number;
}

export interface KYCData {
  dni: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  verificationCode: string;
  birth_date: string;
  /** El backend indica si los datos ya fueron validados exitosamente */
  verified?: boolean;
}

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

export type LoanPurpose =
  | 'EDUCACION'
  | 'SALUD'
  | 'NEGOCIO'
  | 'VIAJE'
  | 'HOGAR'
  | 'DEUDAS'
  | 'OTRO';

export type EducationLevel =
  | 'PRIMARIA'
  | 'SECUNDARIA'
  | 'TECNICA'
  | 'UNIVERSITARIA'
  | 'POSGRADO'
  | 'OTRO';

export type ReferralSource =
  | 'REDES_SOCIALES'
  | 'RECOMENDACION'
  | 'GOOGLE'
  | 'PUBLICIDAD'
  | 'OTRO';

export type AccountType = 'AHORROS' | 'CORRIENTE';

export interface AdditionalIncome {
  /** ID local para identificar el item en el array (UUID generado en frontend) */
  id: string;
  type: AdditionalIncomeType;
  /** Solo requerido cuando type === 'OTRO' */
  custom_type?: string;
  amount: number;
  /** Descripción opcional */
  description?: string;
}

/** Recurso 1: Situación laboral */
export interface LaborSituation {
  employment_status: EmploymentStatus;
  verified?: boolean;
}

/** Recurso 2: Detalles laborales — shape varía según employment_status */
export interface LaborDetails {
  industry: LaborIndustry;
  /** EMPLEADO_DEPENDIENTE (mín 1), INDEPENDIENTE, FREELANCE, EMPRESARIO */
  years_of_activity?: number;
  /** Solo EMPRESARIO */
  business_ruc?: string;
  verified?: boolean;
}

// ── Tipos específicos por situación laboral (escalables) ─────────────────────
//
// Para agregar un nuevo tipo de empleo:
// 1. Agregar el valor a EmploymentStatus (abajo)
// 2. Crear la interfaz LaborDetails<NuevoTipo> aquí
// 3. Agregar la entrada en LaborDetailsByEmploymentStatus
// 4. Agregar la opción en EMPLOYMENT_OPTIONS en lib/constants.ts
// 5. Agregar el validador en EMPLOYMENT_VALIDATORS en labor.actions.ts
// 6. Agregar el campo condicional en el formulario LaborProfileShadcn.tsx

/** Detalles para EMPLEADO_DEPENDIENTE: sector + tiempo en empresa */
export interface LaborDetailsEmpleado {
  industry: LaborIndustry;
  years_of_activity: number;
}

/** Detalles para INDEPENDIENTE: sector + años de actividad */
export interface LaborDetailsIndependiente {
  industry: LaborIndustry;
  years_of_activity: number;
}

/** Detalles para FREELANCE: sector + años de actividad */
export interface LaborDetailsFreelance {
  industry: LaborIndustry;
  years_of_activity: number;
}

/** Detalles para EMPRESARIO: sector + años con el negocio + RUC */
export interface LaborDetailsEmpresario {
  industry: LaborIndustry;
  years_of_activity: number;
  business_ruc: string;
}

/**
 * Mapa que relaciona cada EmploymentStatus con su tipo de detalles específico.
 * Al agregar un nuevo tipo de empleo, agregar aquí su entrada.
 */
export type LaborDetailsByEmploymentStatus = {
  EMPLEADO_DEPENDIENTE: LaborDetailsEmpleado;
  INDEPENDIENTE:        LaborDetailsIndependiente;
  FREELANCE:            LaborDetailsFreelance;
  EMPRESARIO:           LaborDetailsEmpresario;
};

/** Helper: obtiene el tipo de detalles correcto dado un EmploymentStatus */
export type GetLaborDetailsType<T extends EmploymentStatus> = LaborDetailsByEmploymentStatus[T];

/** Recurso 3: Ingresos */
export interface LaborIncome {
  monthly_income: number;
  /** Cómo recibe sus ingresos — afecta scoring */
  income_receipt_method?: IncomeReceiptMethod;
  has_additional_income: boolean;
  additional_incomes: AdditionalIncome[];
  verified?: boolean;
}

/** Estado completo del perfil laboral — lo que devuelve GET /labor/status */
export interface LaborProfileStatus {
  situation: (LaborSituation & { verified: boolean }) | null;
  details: (LaborDetails & { verified: boolean }) | null;
  income: (LaborIncome & { verified: boolean }) | null;
  /** true solo cuando los 3 recursos están verified */
  overall_verified: boolean;
}

/** Shape completo para compatibilidad con LoanApplication */
export interface LaborData {
  situation?: LaborSituation;
  details?: LaborDetails;
  income?: LaborIncome;
  overall_verified?: boolean;
}

export interface EconomicData {
  monthlyIncome: number;
  otherIncome: number;
  monthlyExpenses: number;
  hasDebts: boolean;
  debts: Debt[];
  hasSavings: boolean;
  savingsAmount: number;
  /** Propósito del préstamo - afecta scoring */
  loan_purpose?: LoanPurpose;
  /** Grado de instrucción - afecta scoring */
  education_level?: EducationLevel;
  /** ¿Tiene servicios a su nombre? - afecta scoring */
  has_services?: boolean;
}

export interface Debt {
  id: string;
  entity: string;
  type: string;
  amount: number;
  monthlyPayment: number;
}

/** Perfil económico del usuario — solo campos del formulario visible */
export interface EconomicProfile {
  loan_purpose: LoanPurpose;
  monthly_expenses: number;
  has_debts: boolean;
  debts: Debt[];
  has_property: boolean;
  has_vehicle: boolean;
  has_services: boolean;
  education_level: EducationLevel;
  verified?: boolean;
}

/** Estado del perfil económico — lo que devuelve GET /economic/status */
export interface EconomicProfileStatus {
  profile: (EconomicProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

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

/** Referencias del usuario */
export interface ReferencesProfile {
  family_reference: {
    name: string;
    phone: string;
    relationship: FamilyRelationship;
    relationship_other?: string; // requerido si relationship === 'OTRO'
  };
  non_family_reference: {
    name: string;
    phone: string;
    relationship: NonFamilyRelationship;
    relationship_other?: string; // requerido si relationship === 'OTRO'
    years_known: number;
  };
  verified?: boolean;
}

/** Estado de referencias — lo que devuelve GET /references/status */
export interface ReferencesProfileStatus {
  profile: (ReferencesProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

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
  /** Canal de conocimiento - para marketing */
  referral_source?: ReferralSource;
  /** Especificación cuando referral_source es 'OTRO' */
  referral_other?: string;
}

/** Perfil de dirección del usuario */
export interface AddressProfile {
  address_type: 'google' | 'manual';
  /** Dirección completa (modo google) */
  google_address?: string;
  /** Calle y número (modo manual) */
  street_address?: string;
  /** ID del departamento (ubigeo) */
  region: string;
  /** ID de la provincia (ubigeo) */
  province: string;
  /** ID del distrito (ubigeo) */
  district: string;
  /** Canal de conocimiento */
  referral_source: string;
  referral_other?: string;
  verified?: boolean;
}

/** Estado del perfil de dirección — lo que devuelve GET /additional/status */
export interface AddressProfileStatus {
  profile: (AddressProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

export type ContactMethod = 'whatsapp' | 'sms' | 'email' | 'call';

export interface LoanApplication {
  id: string;
  simulation: LoanSimulation;
  kyc?: KYCData;
  labor?: LaborData;
  economic?: EconomicData;
  references?: ReferencesData;
  additional?: AdditionalData;
  status: ApplicationStatus;
  createdAt: string;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'evaluating'
  | 'approved'
  | 'more_info'
  | 'rejected'
  | 'signed'
  | 'disbursing';

/** Resultado de la evaluación de una solicitud */
export type EvaluationResult = 'approved' | 'rejected' | 'more_info';

/** Registro de una solicitud en el mock-db */
export interface ApplicationRecord {
  id: string;
  userId: string;
  status: ApplicationStatus;
  result?: EvaluationResult;
  /** Timestamp ISO cuando se envió */
  submittedAt: string;
  /** Timestamp ISO cuando se evaluó */
  evaluatedAt?: string;
  /** Timestamp ISO — si fue rechazada, cuándo puede reintentar (30 días) */
  canRetryAt?: string;
}

export interface BankAccount {
  bank: string;
  accountNumber: string;
  account_type?: AccountType;
  cci: string;
}

/** Cuenta bancaria del usuario para desembolso */
export interface BankAccountProfile {
  bank: string;
  account_type: AccountType;
  cci: string;
  verified?: boolean;
}

/** Estado de cuenta bancaria — lo que devuelve GET /bank-account/status */
export interface BankAccountProfileStatus {
  profile: (BankAccountProfile & { verified: boolean }) | null;
  overall_verified: boolean;
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'disabled' | 'danger';

export type BadgeStatus = 'pending' | 'completed' | 'blocked' | 'warning' | 'active' | 'evaluating' | 'rejected' | 'disbursing';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export type StepState = 'completed' | 'active' | 'pending';

export interface Step {
  id: string;
  label: string;
  state: StepState;
}

export interface FunnelStep {
  id: number;
  label: string;
  state: StepState;
}

// ─── PEP Declarations ────────────────────────────────────────────────────────

export interface PEPDeclarations {
  /** Declaro que no soy Persona Expuesta Políticamente (PEP) */
  not_pep: boolean;
  /** Declaro que no soy pariente de una PEP hasta el 2do grado de consanguinidad o afinidad */
  not_pep_relative: boolean;
  /** Acepto los Términos y Condiciones y consiento el uso de mis datos personales */
  accept_terms: boolean;
}
