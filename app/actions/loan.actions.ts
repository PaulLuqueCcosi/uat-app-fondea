'use server';

import {
  LoanApplication,
  LoanSimulation,
  KYCData,
  LaborData,
  EconomicData,
  ReferencesData,
  AdditionalData,
  BankAccount
} from '@/lib/types';
import { sleep, calculateMonthlyPayment, generateId } from '@/lib/utils';

const MONTHLY_RATE = 3.5;
const TEA = 51.1;

// Mock en memoria (por ahora - reemplazar con DB/API real)
let currentApplication: LoanApplication | null = null;
let currentBank: BankAccount | null = null;

export async function buildSimulation(amount: number, months: number): Promise<LoanSimulation> {
  return {
    amount,
    months,
    monthlyPayment: calculateMonthlyPayment(amount, MONTHLY_RATE, months),
    monthlyRate: MONTHLY_RATE,
    tea: TEA,
  };
}

export async function getApplication(): Promise<LoanApplication | null> {
  return currentApplication;
}

export async function getLoanSummary(): Promise<{
  amount: number;
  installments: number;
  installmentAmount: number;
  firstPaymentDate: string;
} | null> {
  const app = currentApplication || await initApplication();

  if (!app.simulation) {
    return null;
  }

  // Calcular la fecha de la primera cuota (30 días después de hoy)
  const firstPaymentDate = new Date();
  firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);

  return {
    amount: app.simulation.amount,
    installments: app.simulation.months,
    installmentAmount: app.simulation.monthlyPayment,
    firstPaymentDate: firstPaymentDate.toISOString(),
  };
}

export async function initApplication(simulation?: LoanSimulation): Promise<LoanApplication> {
  if (currentApplication) return currentApplication;

  const defaultSim = simulation || await buildSimulation(10000, 12);
  currentApplication = {
    id: generateId(),
    simulation: defaultSim,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  return currentApplication;
}

export async function updateSimulation(amount: number, months: number): Promise<LoanApplication> {
  await sleep(500);
  const app = currentApplication || await initApplication();
  const simulation = await buildSimulation(amount, months);
  currentApplication = { ...app, simulation };
  console.log('[MOCK] Simulación actualizada:', { amount, months });
  return currentApplication;
}

export async function verifyDNI(data: KYCData): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  await sleep(2500);

  // Mock: rechazar DNIs de prueba
  if (data.dni === '00000000') {
    return { success: false, error: 'No encontramos este DNI en RENIEC.', errorCode: 'not_found' };
  }
  if (data.dni === '11111111') {
    return { success: false, error: 'Los datos ingresados no coinciden con los registros de RENIEC.', errorCode: 'mismatch' };
  }

  const app = currentApplication || await initApplication();
  currentApplication = { ...app, kyc: data };
  console.log('[MOCK] KYC verificado:', data);
  return { success: true };
}

export async function uploadDocument(_file: File, _side: 'front' | 'back'): Promise<{ success: boolean }> {
  await sleep(2000);
  console.log('[MOCK] Documento subido:', { fileName: _file.name, side: _side });
  return { success: true };
}

export async function verifyBiometric(_selfie: string): Promise<{ success: boolean; error?: string }> {
  await sleep(3000);
  console.log('[MOCK] Biométrico verificado');
  return { success: true };
}

export async function saveLaborProfile(data: LaborData): Promise<{ success: boolean }> {
  await sleep(800);
  const app = currentApplication || await initApplication();
  currentApplication = { ...app, labor: data };
  console.log('[MOCK] Perfil laboral guardado:', data);
  return { success: true };
}

export async function saveEconomicProfile(data: EconomicData): Promise<{ success: boolean }> {
  await sleep(800);
  const app = currentApplication || await initApplication();
  currentApplication = { ...app, economic: data };
  console.log('[MOCK] Perfil económico guardado:', data);
  return { success: true };
}

export async function saveReferences(data: ReferencesData): Promise<{ success: boolean }> {
  await sleep(800);
  const app = currentApplication || await initApplication();
  currentApplication = { ...app, references: data };
  console.log('[MOCK] Referencias guardadas:', data);
  return { success: true };
}

export async function saveAdditional(data: AdditionalData): Promise<{ success: boolean }> {
  await sleep(800);
  const app = currentApplication || await initApplication();
  currentApplication = { ...app, additional: data };
  console.log('[MOCK] Info adicional guardada:', data);
  return { success: true };
}

export async function submitApplication(): Promise<{ success: boolean; error?: string }> {
  await sleep(2000);
  if (!currentApplication) {
    return { success: false, error: 'No hay solicitud activa.' };
  }
  currentApplication = { ...currentApplication, status: 'submitted' };
  console.log('[MOCK] Solicitud enviada');
  return { success: true };
}

export async function evaluateApplication(): Promise<{ result: 'approved' | 'more_info' | 'rejected' }> {
  await sleep(5000);
  // Siempre aprobar en demo
  if (currentApplication) {
    currentApplication = { ...currentApplication, status: 'approved' };
  }
  console.log('[MOCK] Solicitud evaluada: aprobada');
  return { result: 'approved' };
}

export async function saveBankAccount(data: BankAccount): Promise<{ success: boolean }> {
  await sleep(1000);
  currentBank = data;
  console.log('[MOCK] Cuenta bancaria guardada:', data);
  return { success: true };
}

export async function getBankAccount(): Promise<BankAccount | null> {
  return currentBank;
}

export async function signContract(_signature: string): Promise<{ success: boolean }> {
  await sleep(2000);
  if (currentApplication) {
    currentApplication = { ...currentApplication, status: 'signed' };
  }
  console.log('[MOCK] Contrato firmado');
  return { success: true };
}

export async function calculatePaymentCapacity(income: number, expenses: number, debtPayments: number): Promise<number> {
  const disposable = income - expenses - debtPayments;
  return Math.max(0, Math.round(disposable * 0.6));
}
