import { conceptLabel } from './charge-concepts';
import type { PaymentBucketType } from '@/modules/admin/admin-credit-detail.service';
import type { ChargeConcept } from './charge-concepts';

/**
 * Nombre legible de las comisiones que trae la calculadora por defecto. Un código que no está acá (una
 * comisión nueva del catálogo) se muestra con el código escrito en minúsculas y sin guiones bajos.
 */
const KNOWN_FEE_LABELS: Record<string, string> = {
  INTEREST: 'Interés compensatorio',
  RISK_FEE: 'Cargo por riesgo',
  TECH_FEE: 'Cargo tecnológico',
  ADMIN_FEE: 'Cargo administrativo',
  SEGURO_DESGRAVAMEN: 'Seguro de desgravamen',
  GASTO_VERIFICACION: 'Verificación de identidad',
  TARIFA_EVALUACION: 'Evaluación crediticia',
  TARIFA_COBRANZA: 'Gestión de cobranza',
};

export function feeLabel(feeCode: string): string {
  const known = KNOWN_FEE_LABELS[feeCode];
  if (known) return known;
  const spaced = feeCode.toLowerCase().replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Nombre de un balde del pago: "Mora · Gastos", "Cargo por riesgo", "Interés de la cuota" o "Capital". */
export function bucketLabel(type: PaymentBucketType, concept: ChargeConcept | null, feeCode: string | null): string {
  switch (type) {
    case 'PENALTY':
      return `Mora · ${concept ? conceptLabel(concept) : 'sin concepto'}`;
    case 'FEE':
      return feeCode ? feeLabel(feeCode) : concept ? conceptLabel(concept) : 'Comisión';
    case 'INTEREST':
      return 'Interés de la cuota';
    case 'PRINCIPAL':
      return 'Capital';
  }
}
