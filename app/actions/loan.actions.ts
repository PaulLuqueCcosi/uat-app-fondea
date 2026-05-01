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
  try {
    // Simular delay de API externa
    await sleep(2500);

    // Validaciones básicas del lado del servidor
    if (!data.dni || data.dni.length !== 8 || !/^\d{8}$/.test(data.dni)) {
      return { 
        success: false, 
        error: 'El DNI debe tener exactamente 8 dígitos.', 
        errorCode: 'invalid_format' 
      };
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
      return { 
        success: false, 
        error: 'El primer nombre es obligatorio y debe tener al menos 2 caracteres.', 
        errorCode: 'invalid_name' 
      };
    }

    if (!data.firstLastName || data.firstLastName.trim().length < 2) {
      return { 
        success: false, 
        error: 'El primer apellido es obligatorio y debe tener al menos 2 caracteres.', 
        errorCode: 'invalid_lastname' 
      };
    }

    if (!data.verificationCode || data.verificationCode.length !== 3 || !/^\d{3}$/.test(data.verificationCode)) {
      return { 
        success: false, 
        error: 'El código de verificación debe tener exactamente 3 dígitos.', 
        errorCode: 'invalid_code' 
      };
    }

    // Simular llamada a API externa de RENIEC/validación
    const validationResult = await validateWithExternalAPI(data);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
        errorCode: validationResult.errorCode
      };
    }

    // Si la validación es exitosa, guardar los datos
    const app = currentApplication || await initApplication();
    const kycData: KYCData = {
      dni: data.dni,
      firstName: data.firstName.trim().toUpperCase(),
      secondName: (data.secondName ?? '').trim().toUpperCase(),
      firstLastName: data.firstLastName.trim().toUpperCase(),
      secondLastName: (data.secondLastName ?? '').trim().toUpperCase(),
      verificationCode: data.verificationCode,
      birth_date: data.birth_date,
    };

    currentApplication = { ...app, kyc: kycData };
    console.log('[SUCCESS] KYC verificado exitosamente:', {
      dni: kycData.dni,
      fullName: `${kycData.firstName} ${kycData.secondName || ''} ${kycData.firstLastName} ${kycData.secondLastName || ''}`.trim()
    });

    return { success: true };

  } catch (error) {
    console.error('[ERROR] Error en verificación KYC:', error);
    return { 
      success: false, 
      error: 'Error de conexión. Por favor, inténtalo nuevamente.', 
      errorCode: 'connection_error' 
    };
  }
}

/**
 * Simula la validación con API externa (RENIEC u otro proveedor)
 * En producción, aquí iría la llamada real a la API
 */
async function validateWithExternalAPI(data: KYCData): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  // Simular diferentes casos de error para testing
  
  // DNI no encontrado en RENIEC
  if (data.dni === '00000000') {
    return { 
      success: false, 
      error: 'No encontramos este DNI en los registros de RENIEC. Verifica que esté correcto.', 
      errorCode: 'dni_not_found' 
    };
  }

  // Datos no coinciden
  if (data.dni === '11111111') {
    return { 
      success: false, 
      error: 'Los datos ingresados no coinciden con los registros oficiales. Revisa que estén exactamente como aparecen en tu DNI.', 
      errorCode: 'data_mismatch' 
    };
  }

  // DNI con problemas de estado
  if (data.dni === '22222222') {
    return { 
      success: false, 
      error: 'Este DNI presenta observaciones en RENIEC. Contacta con soporte para más información.', 
      errorCode: 'dni_with_issues' 
    };
  }

  // Código de verificación incorrecto
  if (data.verificationCode === '000') {
    return { 
      success: false, 
      error: 'El código de verificación no coincide con el DNI. Revisa los 3 dígitos en la parte inferior de tu documento.', 
      errorCode: 'invalid_verification_code' 
    };
  }

  // Simular timeout de API
  if (data.dni === '99999999') {
    await sleep(8000); // Simular timeout
    return { 
      success: false, 
      error: 'El servicio de validación no está disponible temporalmente. Inténtalo en unos minutos.', 
      errorCode: 'service_timeout' 
    };
  }

  // TODO: En producción, aquí iría la llamada real a la API
  // const response = await fetch('https://api-reniec.gob.pe/validate', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${process.env.RENIEC_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     dni: data.dni,
  //     firstName: data.firstName,
  //     firstLastName: data.firstLastName,
  //     verificationCode: data.verificationCode,
  //   }),
  // });
  // 
  // if (!response.ok) {
  //   throw new Error(`API Error: ${response.status}`);
  // }
  // 
  // const result = await response.json();
  // return result;

  // Por ahora, simular éxito para DNIs válidos
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
