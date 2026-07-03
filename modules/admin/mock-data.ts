/**
 * Mock data para todos los módulos del admin.
 * TODO: Reemplazar con llamadas al backend real.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationStatus = 'SUBMITTED' | 'PROCESSING' | 'PRE_APPROVED' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'FAILED' | 'EXPIRED';
export type CreditStatus = 'ACTIVE' | 'IN_ARREARS' | 'DEFAULTED' | 'SETTLED';
export type InstallmentStatus = 'PENDING' | 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type DocumentStatus = 'verified' | 'pending' | 'failed' | 'not_uploaded';
export type IntentionSource = 'external' | 'internal';

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const mockUsers = [
  { id: 'usr_001', name: 'María García López', dni: '71234567', email: 'maria@gmail.com', phone: '956123456', registeredAt: '2026-05-10T08:30:00Z', maxLoanAmount: 5000 },
  { id: 'usr_002', name: 'Carlos Ruiz Mendoza', dni: '72345678', email: 'carlos@gmail.com', phone: '987654321', registeredAt: '2026-05-15T10:00:00Z', maxLoanAmount: 3000 },
  { id: 'usr_003', name: 'Ana Flores Quispe', dni: '73456789', email: 'ana@hotmail.com', phone: '912345678', registeredAt: '2026-06-01T14:20:00Z', maxLoanAmount: 2000 },
  { id: 'usr_004', name: 'Pedro Huamán Torres', dni: '74567890', email: 'pedro@yahoo.com', phone: '923456789', registeredAt: '2026-06-10T09:15:00Z', maxLoanAmount: 1000 },
  { id: 'usr_005', name: 'Lucía Mamani Ríos', dni: '75678901', email: 'lucia@gmail.com', phone: '934567890', registeredAt: '2026-06-20T16:45:00Z', maxLoanAmount: null },
  { id: 'usr_006', name: 'Jorge Castillo Vega', dni: '76789012', email: 'jorge@outlook.com', phone: '945678901', registeredAt: '2026-06-25T11:00:00Z', maxLoanAmount: 4000 },
  { id: 'usr_007', name: 'Rosa Espinoza Díaz', dni: '77890123', email: 'rosa@gmail.com', phone: '956789012', registeredAt: '2026-06-28T08:00:00Z', maxLoanAmount: 1500 },
  { id: 'usr_008', name: 'Fernando Torres Rojas', dni: '78901234', email: 'fernando@gmail.com', phone: '967890123', registeredAt: '2026-06-29T10:30:00Z', maxLoanAmount: 3500 },
  { id: 'usr_009', name: 'Carmen Salazar Huamán', dni: '79012345', email: 'carmen@hotmail.com', phone: '978901234', registeredAt: '2026-06-30T07:00:00Z', maxLoanAmount: 2500 },
  { id: 'usr_010', name: 'Ricardo Mendoza Paz', dni: '70123456', email: 'ricardo@yahoo.com', phone: '989012345', registeredAt: '2026-06-30T14:00:00Z', maxLoanAmount: null },
];

/**
 * Simula respuesta paginada del backend con búsqueda.
 * TODO: reemplazar con fetch real a GET /api/admin/users?page=X&size=Y&q=Z
 */
export function getMockUsersPaginated(page: number, pageSize: number, query?: string) {
  let filtered = mockUsers;

  if (query) {
    const q = query.toLowerCase();
    filtered = mockUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.dni.includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return {
    data,
    pagination: { page, pageSize, totalItems, totalPages },
  };
}

// ── Expedientes (Forms + Submissions + Verifications) ─────────────────────────

export interface FormSubmission {
  id: string;
  submittedAt: string;
  verificationResult: 'APPROVED' | 'REJECTED';
  submissionData: Record<string, any>;
  rejectionReason?: string;
}

export interface FormVerification {
  status: 'VERIFIED' | 'EXPIRED' | 'REPLACED';
  verifiedAt: string;
  expiresAt: string;
  verificationData?: Record<string, any>;
}

export interface FormLock {
  isBlocked: boolean;
  failedAttempts: number;
  maxAttempts: number;
  blockedUntil: string | null;
}

export interface FormExpediente {
  currentStatus: 'VERIFIED' | 'EXPIRED' | 'PENDING' | 'BLOCKED' | 'REPLACED';
  verifiedAt: string | null;
  expiresAt: string | null;
  totalSubmissions: number;
  lock: FormLock;
  submissions: FormSubmission[];
}

export interface UserExpedientes {
  kyc: FormExpediente;
  labor: FormExpediente;
  economic: FormExpediente;
  references: FormExpediente;
  address: FormExpediente;
  bankAccount: FormExpediente;
}

export const mockUserForms: Record<string, UserExpedientes> = {
  'usr_001': {
    kyc: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-12T10:00:00Z',
      expiresAt: '2026-08-12T10:00:00Z',
      totalSubmissions: 2,
      lock: { isBlocked: false, failedAttempts: 1, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_kyc_002', submittedAt: '2026-05-12T10:00:00Z', verificationResult: 'APPROVED', submissionData: { dni: '71234567', firstName: 'María', secondName: 'Elena', firstLastName: 'García', secondLastName: 'López', verificationCode: '4', birth_date: '15/03/1990' } },
        { id: 'sub_kyc_001', submittedAt: '2026-05-11T14:30:00Z', verificationResult: 'REJECTED', submissionData: { dni: '71234567', firstName: 'Maria', secondName: 'Elena', firstLastName: 'García', secondLastName: 'López', verificationCode: '3', birth_date: '15/03/1990' }, rejectionReason: 'Código de verificación incorrecto' },
      ],
    },
    labor: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-13T08:00:00Z',
      expiresAt: '2026-08-13T08:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_lab_001', submittedAt: '2026-05-13T08:00:00Z', verificationResult: 'APPROVED', submissionData: { employment_status: 'EMPLEADO_DEPENDIENTE', industry: 'TECNOLOGIA', years_of_activity: 3, monthly_income: 3500, income_receipt_method: 'CUENTA_BANCARIA' } },
      ],
    },
    economic: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-14T09:00:00Z',
      expiresAt: '2026-08-14T09:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_eco_001', submittedAt: '2026-05-14T09:00:00Z', verificationResult: 'APPROVED', submissionData: { loan_purpose: 'NEGOCIO', monthly_expenses: 1500, has_debts: false, has_property: true, has_vehicle: false, education_level: 'UNIVERSITARIA' } },
      ],
    },
    references: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-14T10:00:00Z',
      expiresAt: '2026-08-14T10:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_ref_001', submittedAt: '2026-05-14T10:00:00Z', verificationResult: 'APPROVED', submissionData: { family_name: 'Elena García', family_phone: '912345678', family_relation: 'MADRE', non_family_name: 'Carlos Ruiz', non_family_phone: '923456789', non_family_relation: 'COLEGA' } },
      ],
    },
    address: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-14T11:00:00Z',
      expiresAt: '2026-08-14T11:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_addr_001', submittedAt: '2026-05-14T11:00:00Z', verificationResult: 'APPROVED', submissionData: { street_address: 'Av. Javier Prado 1234', region: 'Lima', province: 'Lima', district: 'San Isidro', referral_source: 'GOOGLE' } },
      ],
    },
    bankAccount: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-15T08:00:00Z',
      expiresAt: '2026-08-15T08:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_bank_001', submittedAt: '2026-05-15T08:00:00Z', verificationResult: 'APPROVED', submissionData: { bank_name: 'BCP', account_type: 'AHORROS', account_number: '****4567', cci: '****8901' } },
      ],
    },
  },
};

// ── User Detail ───────────────────────────────────────────────────────────────

export const mockUserDetail = {
  id: 'usr_001', name: 'María García López', dni: '71234567', email: 'maria@gmail.com', phone: '956123456', registeredAt: '2026-05-10T08:30:00Z', maxLoanAmount: 5000,
  score: { total: 720, level: 'BUENO', lastCalculated: '2026-06-25T10:00:00Z', dimensions: { capacidadPago: 85, estabilidadLaboral: 70, perfilPatrimonial: 60, comportamientoCrediticio: 80, coherenciaDatos: 90 } },
  gamification: { points: 450, rank: 'PLATA', maxLoanAmount: 5000, history: [{ date: '2026-06-20', concept: 'Pago puntual', points: 20 }, { date: '2026-06-15', concept: 'Perfil completado', points: 50 }, { date: '2026-06-01', concept: 'Registro', points: 100 }] },
  referrals: { code: 'MARIA2026', totalReferred: 3, pointsEarned: 150 },
};

// ── Solicitudes ───────────────────────────────────────────────────────────────

export const mockApplications = [
  { id: 'app_001', userId: 'usr_001', userName: 'María García López', status: 'APPROVED' as ApplicationStatus, amount: 3000, submittedAt: '2026-06-15T10:00:00Z', score: 720, updatedAt: '2026-06-16T14:00:00Z' },
  { id: 'app_002', userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', status: 'PRE_APPROVED' as ApplicationStatus, amount: 5000, submittedAt: '2026-06-20T08:30:00Z', score: 650, updatedAt: '2026-06-20T09:00:00Z' },
  { id: 'app_003', userId: 'usr_003', userName: 'Ana Flores Quispe', status: 'PROCESSING' as ApplicationStatus, amount: 1500, submittedAt: '2026-06-25T11:00:00Z', score: 580, updatedAt: '2026-06-25T11:05:00Z' },
  { id: 'app_004', userId: 'usr_004', userName: 'Pedro Huamán Torres', status: 'REJECTED' as ApplicationStatus, amount: 10000, submittedAt: '2026-06-22T15:00:00Z', score: 320, updatedAt: '2026-06-22T15:30:00Z' },
  { id: 'app_005', userId: 'usr_005', userName: 'Lucía Mamani Ríos', status: 'BLOCKED' as ApplicationStatus, amount: 2000, submittedAt: '2026-06-28T09:00:00Z', score: 490, updatedAt: '2026-06-28T10:00:00Z' },
];

// ── Créditos ──────────────────────────────────────────────────────────────────

export const mockCredits = [
  { id: 'crd_001', userId: 'usr_001', userName: 'María García López', status: 'ACTIVE' as CreditStatus, amount: 3000, totalToPay: 3450, installments: 6, disbursedAt: '2026-06-17T10:00:00Z', dueDate: '2026-12-17', pendingBalance: 2300, daysOverdue: 0 },
  { id: 'crd_002', userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', status: 'IN_ARREARS' as CreditStatus, amount: 2000, totalToPay: 2280, installments: 3, disbursedAt: '2026-04-01T10:00:00Z', dueDate: '2026-07-01', pendingBalance: 780, daysOverdue: 5 },
  { id: 'crd_003', userId: 'usr_003', userName: 'Ana Flores Quispe', status: 'SETTLED' as CreditStatus, amount: 1000, totalToPay: 1120, installments: 2, disbursedAt: '2026-03-01T10:00:00Z', dueDate: '2026-05-01', pendingBalance: 0, daysOverdue: 0 },
  { id: 'crd_004', userId: 'usr_004', userName: 'Pedro Huamán Torres', status: 'DEFAULTED' as CreditStatus, amount: 5000, totalToPay: 5900, installments: 12, disbursedAt: '2026-01-15T10:00:00Z', dueDate: '2027-01-15', pendingBalance: 4200, daysOverdue: 45 },
];

export const mockInstallments = [
  { number: 1, dueDate: '2026-07-17', amount: 575, paid: 575, mora: 0, moraPaid: 0, status: 'PAID' as InstallmentStatus, daysOverdue: 0, paidAt: '2026-07-15T10:00:00Z' },
  { number: 2, dueDate: '2026-08-17', amount: 575, paid: 575, mora: 0, moraPaid: 0, status: 'PAID' as InstallmentStatus, daysOverdue: 0, paidAt: '2026-08-16T10:00:00Z' },
  { number: 3, dueDate: '2026-09-17', amount: 575, paid: 0, mora: 0, moraPaid: 0, status: 'ACTIVE' as InstallmentStatus, daysOverdue: 0, paidAt: null },
  { number: 4, dueDate: '2026-10-17', amount: 575, paid: 0, mora: 0, moraPaid: 0, status: 'PENDING' as InstallmentStatus, daysOverdue: 0, paidAt: null },
  { number: 5, dueDate: '2026-11-17', amount: 575, paid: 0, mora: 0, moraPaid: 0, status: 'PENDING' as InstallmentStatus, daysOverdue: 0, paidAt: null },
  { number: 6, dueDate: '2026-12-17', amount: 575, paid: 0, mora: 0, moraPaid: 0, status: 'PENDING' as InstallmentStatus, daysOverdue: 0, paidAt: null },
];

// ── Cobranza ──────────────────────────────────────────────────────────────────

export const mockCollections = {
  dueToday: [
    { userId: 'usr_001', userName: 'María García López', phone: '956123456', creditId: 'crd_001', installmentNo: 3, amount: 575, mora: 0, partialPaid: 0, dueDate: '2026-06-30', daysOverdue: 0 },
    { userId: 'usr_005', userName: 'Lucía Mamani Ríos', phone: '912345678', creditId: 'crd_005', installmentNo: 1, amount: 320, mora: 0, partialPaid: 0, dueDate: '2026-06-30', daysOverdue: 0 },
  ],
  dueNext7Days: [
    { userId: 'usr_003', userName: 'Ana Flores Quispe', phone: '934567890', creditId: 'crd_003', installmentNo: 2, amount: 450, mora: 0, partialPaid: 0, dueDate: '2026-07-02', daysOverdue: 0 },
    { userId: 'usr_006', userName: 'Roberto Sánchez Díaz', phone: '945678123', creditId: 'crd_006', installmentNo: 1, amount: 680, mora: 0, partialPaid: 0, dueDate: '2026-07-04', daysOverdue: 0 },
    { userId: 'usr_007', userName: 'Carmen Quispe Huamán', phone: '967891234', creditId: 'crd_007', installmentNo: 3, amount: 290, mora: 0, partialPaid: 0, dueDate: '2026-07-06', daysOverdue: 0 },
  ],
  mildArrears: [
    { userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', phone: '987654321', creditId: 'crd_002', installmentNo: 2, amount: 780, mora: 15, daysOverdue: 3, dueDate: '2026-06-27' },
    { userId: 'usr_008', userName: 'Jorge Vargas Poma', phone: '978123456', creditId: 'crd_008', installmentNo: 4, amount: 520, mora: 5, daysOverdue: 1, dueDate: '2026-06-29' },
  ],
  severeArrears: [
    { userId: 'usr_009', userName: 'Elena Torres Mendoza', phone: '956789012', creditId: 'crd_009', installmentNo: 3, amount: 1200, mora: 56, daysOverdue: 8, dueDate: '2026-06-22' },
    { userId: 'usr_010', userName: 'Miguel Paredes Cruz', phone: '934561234', creditId: 'crd_010', installmentNo: 2, amount: 890, mora: 98, daysOverdue: 14, dueDate: '2026-06-16' },
  ],
  defaulted: [
    { userId: 'usr_004', userName: 'Pedro Huamán Torres', phone: '923456789', creditId: 'crd_004', installmentNo: 4, amount: 4200, mora: 350, daysOverdue: 45, dueDate: '2026-05-16' },
  ],
};

// ── Contratos ─────────────────────────────────────────────────────────────────

export const mockContracts = [
  { id: 'ctr_001', userId: 'usr_001', userName: 'María García López', applicationId: 'app_001', status: 'SIGNED', signedAt: '2026-06-16T12:00:00Z' },
  { id: 'ctr_002', userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', applicationId: 'app_002', status: 'PENDING', signedAt: null },
  { id: 'ctr_003', userId: 'usr_003', userName: 'Ana Flores Quispe', applicationId: 'app_003', status: 'SIGNED', signedAt: '2026-03-02T09:00:00Z' },
];

// ── Notificaciones ────────────────────────────────────────────────────────────

export const mockNotifications = [
  { id: 'ntf_001', userId: 'usr_001', userName: 'María García López', type: 'PAYMENT_REMINDER', title: 'Tu cuota vence mañana', message: 'Recuerda pagar tu cuota #3 de S/ 575', priority: 'high', sentAt: '2026-06-29T08:00:00Z', read: false },
  { id: 'ntf_002', userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', type: 'OVERDUE', title: 'Cuota vencida', message: 'Tu cuota #2 está vencida hace 5 días', priority: 'urgent', sentAt: '2026-06-27T10:00:00Z', read: true },
  { id: 'ntf_003', userId: 'usr_005', userName: 'Lucía Mamani Ríos', type: 'SYSTEM', title: 'Bienvenida a Fondea', message: 'Tu cuenta ha sido creada exitosamente', priority: 'normal', sentAt: '2026-06-20T16:45:00Z', read: true },
];

// ── Referidos ─────────────────────────────────────────────────────────────────

export const mockReferrals = {
  totalCodes: 45, totalReferred: 18, totalPointsGiven: 2700, conversionRate: 40,
  topReferrers: [
    { userId: 'usr_001', userName: 'María García López', code: 'MARIA2026', referred: 3, pointsEarned: 150 },
    { userId: 'usr_003', userName: 'Ana Flores Quispe', code: 'ANA2026', referred: 5, pointsEarned: 250 },
    { userId: 'usr_005', userName: 'Lucía Mamani Ríos', code: 'LUCIA2026', referred: 2, pointsEarned: 100 },
  ],
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const mockDashboardMetrics = {
  applicationsToday: 12, applicationsProcessing: 3, preApprovedPendingDocs: 8, activeCredits: 47,
  totalOverdue: 15200, installmentsDueToday: 5, newUsersToday: 7, conversionRate: 34,
};

/** Simula respuesta paginada de solicitudes */
export function getMockApplicationsPaginated(page: number, pageSize: number, query?: string) {
  let filtered = mockApplications;
  if (query) {
    const q = query.toLowerCase();
    filtered = mockApplications.filter(
      (a) => a.userName.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
    );
  }
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, pagination: { page, pageSize, totalItems, totalPages } };
}

// ── Intenciones ───────────────────────────────────────────────────────────────

export type IntentionStatus = 'ACTIVE' | 'LOCKED' | 'CANCELLED' | 'REPLACED';

export interface MockIntention {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  status: IntentionStatus;
  createdAt: string;
  updatedAt: string;
  applicationId: string | null;
}

export const mockIntentions: MockIntention[] = [
  { id: 'int_001', userId: 'usr_001', userName: 'María García López', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 3000, termDays: 30, installmentCount: 3, isFirstLoan: false, status: 'LOCKED', createdAt: '2026-06-15T09:00:00Z', updatedAt: '2026-06-15T10:00:00Z', applicationId: 'app_001' },
  { id: 'int_002', userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 5000, termDays: 60, installmentCount: 6, isFirstLoan: true, status: 'ACTIVE', createdAt: '2026-06-20T08:00:00Z', updatedAt: '2026-06-20T08:30:00Z', applicationId: null },
  { id: 'int_003', userId: 'usr_003', userName: 'Ana Flores Quispe', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 1500, termDays: 30, installmentCount: 3, isFirstLoan: true, status: 'ACTIVE', createdAt: '2026-06-25T11:00:00Z', updatedAt: '2026-06-25T11:00:00Z', applicationId: null },
  { id: 'int_004', userId: 'usr_004', userName: 'Pedro Huamán Torres', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 10000, termDays: 90, installmentCount: 12, isFirstLoan: false, status: 'CANCELLED', createdAt: '2026-06-22T14:00:00Z', updatedAt: '2026-06-22T15:00:00Z', applicationId: null },
  { id: 'int_005', userId: 'usr_001', userName: 'María García López', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 2000, termDays: 30, installmentCount: 2, isFirstLoan: false, status: 'REPLACED', createdAt: '2026-06-10T10:00:00Z', updatedAt: '2026-06-15T09:00:00Z', applicationId: null },
  { id: 'int_006', userId: 'usr_005', userName: 'Lucía Mamani Ríos', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 500, termDays: 7, installmentCount: 1, isFirstLoan: true, status: 'ACTIVE', createdAt: '2026-06-28T08:00:00Z', updatedAt: '2026-06-28T08:00:00Z', applicationId: null },
];

export function getMockIntentionsPaginated(page: number, pageSize: number, query?: string, status?: string) {
  let filtered = mockIntentions;
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((i) => i.userName.toLowerCase().includes(q) || i.id.includes(q));
  }
  if (status) {
    filtered = filtered.filter((i) => i.status === status);
  }
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, pagination: { page, pageSize, totalItems, totalPages } };
}

// ── Intenciones Anónimas (Landing / Calculadora) ──────────────────────────────

export interface MockCalcIntention {
  id: string;
  productId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
  isFirstLoan: boolean;
  selectedRangeCode: string | null;
  registeredUserId: string | null;
  createdAt: string;
}

export const mockCalcIntentions: MockCalcIntention[] = [
  { id: 'calc_001', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 500, termDays: 7, installmentCount: 1, isFirstLoan: true, selectedRangeCode: 'ALTO', registeredUserId: 'usr_005', createdAt: '2026-06-28T07:50:00Z' },
  { id: 'calc_002', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 1000, termDays: 30, installmentCount: 3, isFirstLoan: true, selectedRangeCode: 'MEDIO', registeredUserId: null, createdAt: '2026-06-28T09:10:00Z' },
  { id: 'calc_003', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 3000, termDays: 60, installmentCount: 6, isFirstLoan: false, selectedRangeCode: 'BAJO', registeredUserId: null, createdAt: '2026-06-29T11:00:00Z' },
  { id: 'calc_004', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 200, termDays: 7, installmentCount: 1, isFirstLoan: true, selectedRangeCode: 'ALTO', registeredUserId: 'usr_003', createdAt: '2026-06-25T10:30:00Z' },
  { id: 'calc_005', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 1500, termDays: 30, installmentCount: 3, isFirstLoan: true, selectedRangeCode: null, registeredUserId: null, createdAt: '2026-06-30T14:20:00Z' },
  { id: 'calc_006', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 500, termDays: 15, installmentCount: 2, isFirstLoan: true, selectedRangeCode: 'MEDIO', registeredUserId: null, createdAt: '2026-06-30T15:00:00Z' },
  { id: 'calc_007', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 300, termDays: 7, installmentCount: 1, isFirstLoan: true, selectedRangeCode: 'ALTO', registeredUserId: 'usr_006', createdAt: '2026-06-24T08:00:00Z' },
  { id: 'calc_008', productId: '550e8400-e29b-41d4-a716-446655440000', amount: 1000, termDays: 30, installmentCount: 2, isFirstLoan: true, selectedRangeCode: 'MEDIO', registeredUserId: null, createdAt: '2026-06-30T16:00:00Z' },
];

export const mockCalcMetrics = {
  totalIntentions: 142,
  last30Days: 89,
  avgAmount: 1250,
  topAmount: 500,
  topTerm: 30,
  conversion: { total: 142, registered: 34, rate: 23.9 },
};
