/**
 * Mock data para todos los módulos del admin.
 * TODO: Reemplazar con llamadas al backend real.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationStatus = 'SUBMITTED' | 'PROCESSING' | 'PRE_APPROVED' | 'APPROVED' | 'REJECTED' | 'REJECTED_BY_USER' | 'BLOCKED' | 'FAILED' | 'EXPIRED';
export type CreditStatus = 'ACTIVE' | 'OVERDUE' | 'DEFAULTED' | 'PAID_OFF';
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

import type { FormSubmission, FormLock, FormExpediente, UserExpedientes } from './admin-user-detail.types';

export type { FormSubmission, FormLock, FormExpediente, UserExpedientes };

export interface FormVerification {
  status: 'VERIFIED' | 'EXPIRED' | 'REPLACED';
  verifiedAt: string;
  expiresAt: string;
  verificationData?: Record<string, any>;
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
        { id: 'sub_kyc_002', submittedAt: '2026-05-12T10:00:00Z', verificationResult: 'APPROVED', submissionData: { dni: '71234567', firstName: 'María', secondName: 'Elena', firstLastName: 'García', secondLastName: 'López', verificationCode: '4', birth_date: '15/03/1990' }, ruleOutcomes: [] },
        { id: 'sub_kyc_001', submittedAt: '2026-05-11T14:30:00Z', verificationResult: 'REJECTED', submissionData: { dni: '71234567', firstName: 'Maria', secondName: 'Elena', firstLastName: 'García', secondLastName: 'López', verificationCode: '3', birth_date: '15/03/1990' }, rejectionReason: 'Código de verificación incorrecto', ruleOutcomes: [] },
      ],
    },
    labor: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-13T08:00:00Z',
      expiresAt: '2026-08-13T08:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_lab_001', submittedAt: '2026-05-13T08:00:00Z', verificationResult: 'APPROVED', submissionData: { employment_status: 'EMPLEADO_DEPENDIENTE', industry: 'TECNOLOGIA', years_of_activity: 3, monthly_income: 3500, income_receipt_method: 'CUENTA_BANCARIA' }, ruleOutcomes: [] },
      ],
    },
    economic: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-14T09:00:00Z',
      expiresAt: '2026-08-14T09:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_eco_001', submittedAt: '2026-05-14T09:00:00Z', verificationResult: 'APPROVED', submissionData: { loan_purpose: 'NEGOCIO', monthly_expenses: 1500, has_debts: false, has_property: true, has_vehicle: false, education_level: 'UNIVERSITARIA' }, ruleOutcomes: [] },
      ],
    },
    references: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-14T10:00:00Z',
      expiresAt: '2026-08-14T10:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_ref_001', submittedAt: '2026-05-14T10:00:00Z', verificationResult: 'APPROVED', submissionData: { family_name: 'Elena García', family_phone: '912345678', family_relation: 'MADRE', non_family_name: 'Carlos Ruiz', non_family_phone: '923456789', non_family_relation: 'COLEGA' }, ruleOutcomes: [] },
      ],
    },
    address: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-14T11:00:00Z',
      expiresAt: '2026-08-14T11:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_addr_001', submittedAt: '2026-05-14T11:00:00Z', verificationResult: 'APPROVED', submissionData: { street_address: 'Av. Javier Prado 1234', region: 'Lima', province: 'Lima', district: 'San Isidro', referral_source: 'GOOGLE' }, ruleOutcomes: [] },
      ],
    },
    bankAccount: {
      currentStatus: 'VERIFIED',
      verifiedAt: '2026-05-15T08:00:00Z',
      expiresAt: '2026-08-15T08:00:00Z',
      totalSubmissions: 1,
      lock: { isBlocked: false, failedAttempts: 0, maxAttempts: 3, blockedUntil: null },
      submissions: [
        { id: 'sub_bank_001', submittedAt: '2026-05-15T08:00:00Z', verificationResult: 'APPROVED', submissionData: { bank_name: 'BCP', account_type: 'AHORROS', account_number: '****4567', cci: '****8901' }, ruleOutcomes: [] },
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

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export const mockDashboardMetrics = {
  applicationsToday: 12, applicationsProcessing: 3, preApprovedPendingDocs: 8, activeCredits: 47,
  totalOverdue: 15200, installmentsDueToday: 5, newUsersToday: 7, conversionRate: 34,
};

export interface DashboardKPI {
  id: string;
  label: string;
  value: number;
  format: 'number' | 'currency' | 'percentage';
  description: string;
  trend?: { value: number; direction: 'up' | 'down' };
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const mockKPIsToday: DashboardKPI[] = [
  { id: 'active_loans', label: 'Préstamos activos hoy', value: 47, format: 'number', description: 'Préstamos vigentes en cartera', trend: { value: 3, direction: 'up' }, variant: 'success' },
  { id: 'new_applications', label: 'Nuevas solicitudes hoy', value: 8, format: 'number', description: 'Solicitudes recibidas hoy', trend: { value: 2, direction: 'up' }, variant: 'default' },
  { id: 'approval_rate', label: 'Tasa de aprobación del día', value: 62.5, format: 'percentage', description: '5 de 8 solicitudes aprobadas', trend: { value: 5, direction: 'up' }, variant: 'success' },
  { id: 'disbursements', label: 'Desembolsos del día', value: 12500, format: 'currency', description: 'Monto total desembolsado hoy', trend: { value: 8, direction: 'up' }, variant: 'info' },
  { id: 'payments_received', label: 'Pagos recibidos hoy', value: 8750, format: 'currency', description: 'Pagos de clientes hoy', trend: { value: 12, direction: 'up' }, variant: 'success' },
  { id: 'loans_due_today', label: 'Préstamos con vencimiento HOY', value: 5, format: 'number', description: '3 ya pagaron, 2 pendientes', variant: 'warning' },
  { id: 'delinquency_rate', label: 'Tasa de mora al día', value: 8.5, format: 'percentage', description: 'Cartera activa en mora', trend: { value: 1.2, direction: 'down' }, variant: 'warning' },
  { id: 'arrears_1_7', label: 'Mora 1-7 días', value: 4, format: 'number', description: 'Recordatorio proactivo', variant: 'warning' },
  { id: 'arrears_8_30', label: 'Mora 8-30 días', value: 2, format: 'number', description: 'Gestión activa de cobranza', variant: 'error' },
  { id: 'arrears_30_plus', label: 'Mora +30 días', value: 1, format: 'number', description: 'Gestión prolongada', variant: 'error' },
  { id: 'new_users', label: 'Nuevos clientes registrados hoy', value: 11, format: 'number', description: 'Registros en fondea.pe', trend: { value: 4, direction: 'up' }, variant: 'default' },
  { id: 'funnel_conversion', label: 'Tasa de conversión del embudo', value: 3.2, format: 'percentage', description: 'Visita → préstamo aprobado', trend: { value: 0.5, direction: 'up' }, variant: 'info' },
  { id: 'pending_complaints', label: 'Reclamos pendientes', value: 2, format: 'number', description: 'Plazo de 15 días hábiles corriendo', variant: 'warning' },
  { id: 'runway', label: 'Runway disponible', value: 8, format: 'number', description: 'Meses de operación sin fondeo adicional (rev. mensual)', variant: 'info' },
];

export interface DashboardKPIHistory {
  date: string;
  activeLoans: number;
  newApplications: number;
  approvalRate: number;
  disbursements: number;
  paymentsReceived: number;
  loansDueToday: number;
  delinquencyRate: number;
  arrears1_7: number;
  arrears8_30: number;
  arrears30Plus: number;
  newUsers: number;
  funnelConversion: number;
  pendingComplaints: number;
}

export const mockKPIHistory: DashboardKPIHistory[] = [
  { date: '2026-07-02', activeLoans: 42, newApplications: 5, approvalRate: 60, disbursements: 8000, paymentsReceived: 6200, loansDueToday: 3, delinquencyRate: 9.5, arrears1_7: 5, arrears8_30: 3, arrears30Plus: 1, newUsers: 8, funnelConversion: 2.8, pendingComplaints: 3 },
  { date: '2026-07-03', activeLoans: 43, newApplications: 7, approvalRate: 57, disbursements: 10500, paymentsReceived: 7100, loansDueToday: 4, delinquencyRate: 9.2, arrears1_7: 5, arrears8_30: 3, arrears30Plus: 1, newUsers: 6, funnelConversion: 2.9, pendingComplaints: 3 },
  { date: '2026-07-04', activeLoans: 44, newApplications: 4, approvalRate: 50, disbursements: 6000, paymentsReceived: 9200, loansDueToday: 6, delinquencyRate: 9.0, arrears1_7: 4, arrears8_30: 3, arrears30Plus: 1, newUsers: 5, funnelConversion: 2.6, pendingComplaints: 2 },
  { date: '2026-07-05', activeLoans: 44, newApplications: 3, approvalRate: 66, disbursements: 4500, paymentsReceived: 5800, loansDueToday: 2, delinquencyRate: 8.8, arrears1_7: 4, arrears8_30: 2, arrears30Plus: 1, newUsers: 4, funnelConversion: 2.5, pendingComplaints: 2 },
  { date: '2026-07-06', activeLoans: 45, newApplications: 9, approvalRate: 55, disbursements: 14000, paymentsReceived: 7500, loansDueToday: 7, delinquencyRate: 8.7, arrears1_7: 4, arrears8_30: 2, arrears30Plus: 1, newUsers: 12, funnelConversion: 3.0, pendingComplaints: 2 },
  { date: '2026-07-07', activeLoans: 46, newApplications: 6, approvalRate: 66, disbursements: 9000, paymentsReceived: 8100, loansDueToday: 4, delinquencyRate: 8.6, arrears1_7: 4, arrears8_30: 2, arrears30Plus: 1, newUsers: 9, funnelConversion: 3.1, pendingComplaints: 2 },
  { date: '2026-07-08', activeLoans: 47, newApplications: 8, approvalRate: 62.5, disbursements: 12500, paymentsReceived: 8750, loansDueToday: 5, delinquencyRate: 8.5, arrears1_7: 4, arrears8_30: 2, arrears30Plus: 1, newUsers: 11, funnelConversion: 3.2, pendingComplaints: 2 },
];

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
