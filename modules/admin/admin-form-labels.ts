/**
 * Diccionario de labels en español para los campos de cada formulario.
 * Se usa en el admin para mostrar los datos de submissions de forma legible.
 */

const KYC_LABELS: Record<string, string> = {
  dni: 'DNI',
  firstName: 'Primer nombre',
  secondName: 'Segundo nombre',
  firstLastName: 'Apellido paterno',
  secondLastName: 'Apellido materno',
  birthDate: 'Fecha de nacimiento',
  verificationCode: 'Código de verificación',
};

const LABOR_LABELS: Record<string, string> = {
  situation: 'Situación laboral',
  'details.industry': 'Industria',
  'details.yearsOfActivity': 'Años de actividad',
  'details.businessRuc': 'RUC',
  'income.monthlyIncome': 'Ingreso mensual',
  'income.incomeReceiptMethod': 'Método de cobro',
  'income.hasAdditionalIncome': 'Ingresos adicionales',
  'income.additionalIncomes': 'Detalle ingresos adicionales',
  // Flat keys (cuando el JSON se guarda plano)
  industry: 'Industria',
  yearsOfActivity: 'Años de actividad',
  businessRuc: 'RUC',
  monthlyIncome: 'Ingreso mensual',
  incomeReceiptMethod: 'Método de cobro',
  hasAdditionalIncome: 'Ingresos adicionales',
  additionalIncomes: 'Detalle ingresos adicionales',
  employment_status: 'Situación laboral',
  years_of_activity: 'Años de actividad',
  monthly_income: 'Ingreso mensual',
  income_receipt_method: 'Método de cobro',
};

const ECONOMIC_LABELS: Record<string, string> = {
  loanPurpose: 'Propósito del préstamo',
  loan_purpose: 'Propósito del préstamo',
  monthlyExpenses: 'Gastos mensuales',
  monthly_expenses: 'Gastos mensuales',
  hasDebts: 'Tiene deudas',
  has_debts: 'Tiene deudas',
  hasProperty: 'Tiene propiedades',
  has_property: 'Tiene propiedades',
  hasVehicle: 'Tiene vehículo',
  has_vehicle: 'Tiene vehículo',
  educationLevel: 'Nivel educativo',
  education_level: 'Nivel educativo',
};

const REFERENCES_LABELS: Record<string, string> = {
  familyName: 'Nombre referencia familiar',
  family_name: 'Nombre referencia familiar',
  familyPhone: 'Teléfono familiar',
  family_phone: 'Teléfono familiar',
  familyRelation: 'Parentesco',
  family_relation: 'Parentesco',
  nonFamilyName: 'Nombre ref. no familiar',
  non_family_name: 'Nombre ref. no familiar',
  nonFamilyPhone: 'Teléfono ref. no familiar',
  non_family_phone: 'Teléfono ref. no familiar',
  nonFamilyRelation: 'Relación',
  non_family_relation: 'Relación',
};

const ADDRESS_LABELS: Record<string, string> = {
  streetAddress: 'Dirección',
  street_address: 'Dirección',
  region: 'Región',
  province: 'Provincia',
  district: 'Distrito',
  referralSource: 'Cómo nos conociste',
  referral_source: 'Cómo nos conociste',
};

const BANK_ACCOUNT_LABELS: Record<string, string> = {
  bankName: 'Banco',
  bank_name: 'Banco',
  accountType: 'Tipo de cuenta',
  account_type: 'Tipo de cuenta',
  accountNumber: 'Número de cuenta',
  account_number: 'Número de cuenta',
  cci: 'CCI',
};

const FORM_LABELS_MAP: Record<string, Record<string, string>> = {
  kyc: KYC_LABELS,
  labor: LABOR_LABELS,
  economic: ECONOMIC_LABELS,
  references: REFERENCES_LABELS,
  address: ADDRESS_LABELS,
  bankAccount: BANK_ACCOUNT_LABELS,
};

/**
 * Obtiene el label en español para un campo de un formulario.
 * Si no existe en el diccionario, formatea la key (snake_case/camelCase → palabras).
 */
export function getFieldLabel(formKey: string, fieldKey: string): string {
  const labels = FORM_LABELS_MAP[formKey];
  if (labels && labels[fieldKey]) {
    return labels[fieldKey];
  }
  // Fallback: formatear la key
  return fieldKey
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Formatea un valor para mostrar en la UI del admin.
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
