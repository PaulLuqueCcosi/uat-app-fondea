/**
 * Mock data para todos los módulos del admin.
 * TODO: Reemplazar con llamadas al backend real.
 */

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const mockUsers = [
  { id: 'usr_001', name: 'María García López', dni: '71234567', email: 'maria@gmail.com', phone: '956123456', registeredAt: '2026-05-10T08:30:00Z', status: 'active', employment: 'Dependiente', monthlyIncome: 3500, points: 450, maxLoanAmount: 5000, kycStatus: 'VERIFIED', profileProgress: 100 },
  { id: 'usr_002', name: 'Carlos Ruiz Mendoza', dni: '72345678', email: 'carlos@gmail.com', phone: '987654321', registeredAt: '2026-05-15T10:00:00Z', status: 'active', employment: 'Independiente', monthlyIncome: 5200, points: 320, maxLoanAmount: 3000, kycStatus: 'VERIFIED', profileProgress: 85 },
  { id: 'usr_003', name: 'Ana Flores Quispe', dni: '73456789', email: 'ana@hotmail.com', phone: '912345678', registeredAt: '2026-06-01T14:20:00Z', status: 'active', employment: 'Freelance', monthlyIncome: 2800, points: 200, maxLoanAmount: 2000, kycStatus: 'VERIFIED', profileProgress: 70 },
  { id: 'usr_004', name: 'Pedro Huamán Torres', dni: '74567890', email: 'pedro@yahoo.com', phone: '923456789', registeredAt: '2026-06-10T09:15:00Z', status: 'blocked', employment: 'Empresario', monthlyIncome: 8000, points: 100, maxLoanAmount: 1000, kycStatus: 'PENDING', profileProgress: 40 },
  { id: 'usr_005', name: 'Lucía Mamani Ríos', dni: '75678901', email: 'lucia@gmail.com', phone: '934567890', registeredAt: '2026-06-20T16:45:00Z', status: 'active', employment: null, monthlyIncome: null, points: null, maxLoanAmount: null, kycStatus: 'PENDING', profileProgress: 15 },
  { id: 'usr_006', name: 'Jorge Castillo Vega', dni: '76789012', email: 'jorge@outlook.com', phone: '945678901', registeredAt: '2026-06-25T11:00:00Z', status: 'active', employment: 'Dependiente', monthlyIncome: 4100, points: 380, maxLoanAmount: 4000, kycStatus: 'VERIFIED', profileProgress: 100 },
  { id: 'usr_007', name: 'Rosa Espinoza Díaz', dni: '77890123', email: 'rosa@gmail.com', phone: '956789012', registeredAt: '2026-06-28T08:00:00Z', status: 'active', employment: 'Independiente', monthlyIncome: 3000, points: 150, maxLoanAmount: 1500, kycStatus: 'VERIFIED', profileProgress: 55 },
];

export const mockUserDetail = {
  id: 'usr_001',
  name: 'María García López',
  dni: '71234567',
  email: 'maria@gmail.com',
  phone: '956123456',
  registeredAt: '2026-05-10T08:30:00Z',
  score: { total: 720, level: 'BUENO', lastCalculated: '2026-06-25T10:00:00Z', dimensions: { capacidadPago: 85, estabilidadLaboral: 70, perfilPatrimonial: 60, comportamientoCrediticio: 80, coherenciaDatos: 90 } },
  gamification: { points: 450, rank: 'PLATA', maxLoanAmount: 5000, history: [{ date: '2026-06-20', concept: 'Pago puntual', points: 20 }, { date: '2026-06-15', concept: 'Perfil completado', points: 50 }, { date: '2026-06-01', concept: 'Registro', points: 100 }] },
  referrals: { code: 'MARIA2026', totalReferred: 3, pointsEarned: 150 },
};

// ── Solicitudes ───────────────────────────────────────────────────────────────

export type ApplicationStatus = 'SUBMITTED' | 'PROCESSING' | 'PRE_APPROVED' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'FAILED' | 'EXPIRED';

export const mockApplications = [
  { id: 'app_001', userId: 'usr_001', userName: 'María García López', status: 'APPROVED' as ApplicationStatus, amount: 3000, submittedAt: '2026-06-15T10:00:00Z', score: 720, updatedAt: '2026-06-16T14:00:00Z' },
  { id: 'app_002', userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', status: 'PRE_APPROVED' as ApplicationStatus, amount: 5000, submittedAt: '2026-06-20T08:30:00Z', score: 650, updatedAt: '2026-06-20T09:00:00Z' },
  { id: 'app_003', userId: 'usr_003', userName: 'Ana Flores Quispe', status: 'PROCESSING' as ApplicationStatus, amount: 1500, submittedAt: '2026-06-25T11:00:00Z', score: 580, updatedAt: '2026-06-25T11:05:00Z' },
  { id: 'app_004', userId: 'usr_004', userName: 'Pedro Huamán Torres', status: 'REJECTED' as ApplicationStatus, amount: 10000, submittedAt: '2026-06-22T15:00:00Z', score: 320, updatedAt: '2026-06-22T15:30:00Z' },
  { id: 'app_005', userId: 'usr_005', userName: 'Lucía Mamani Ríos', status: 'BLOCKED' as ApplicationStatus, amount: 2000, submittedAt: '2026-06-28T09:00:00Z', score: 490, updatedAt: '2026-06-28T10:00:00Z' },
  { id: 'app_006', userId: 'usr_001', userName: 'María García López', status: 'SUBMITTED' as ApplicationStatus, amount: 4000, submittedAt: '2026-06-30T08:00:00Z', score: 720, updatedAt: '2026-06-30T08:00:00Z' },
];

// ── Créditos ──────────────────────────────────────────────────────────────────

export type CreditStatus = 'ACTIVE' | 'IN_ARREARS' | 'DEFAULTED' | 'SETTLED';
export type InstallmentStatus = 'PENDING' | 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

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
    { userId: 'usr_001', userName: 'María García López', phone: '956123456', creditId: 'crd_001', installmentNo: 3, amount: 575, mora: 0, partialPaid: 0 },
  ],
  mildArrears: [
    { userId: 'usr_002', userName: 'Carlos Ruiz Mendoza', phone: '987654321', creditId: 'crd_002', installmentNo: 2, amount: 780, mora: 25, daysOverdue: 5 },
  ],
  severeArrears: [],
  defaulted: [
    { userId: 'usr_004', userName: 'Pedro Huamán Torres', phone: '923456789', creditId: 'crd_004', installmentNo: 4, amount: 4200, mora: 350, daysOverdue: 45 },
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
  totalCodes: 45,
  totalReferred: 18,
  totalPointsGiven: 2700,
  conversionRate: 40,
  topReferrers: [
    { userId: 'usr_001', userName: 'María García López', code: 'MARIA2026', referred: 3, pointsEarned: 150 },
    { userId: 'usr_003', userName: 'Ana Flores Quispe', code: 'ANA2026', referred: 5, pointsEarned: 250 },
    { userId: 'usr_005', userName: 'Lucía Mamani Ríos', code: 'LUCIA2026', referred: 2, pointsEarned: 100 },
  ],
};

// ── Dashboard Metrics ─────────────────────────────────────────────────────────

export const mockDashboardMetrics = {
  applicationsToday: 12,
  applicationsProcessing: 3,
  preApprovedPendingDocs: 8,
  activeCredits: 47,
  totalOverdue: 15200,
  installmentsDueToday: 5,
  newUsersToday: 7,
  conversionRate: 34,
};
