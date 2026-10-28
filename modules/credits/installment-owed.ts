import { formatCurrency } from '@/lib/admin-formatters';
import type { Installment } from './credit.types';

/** Lo que el cliente debe de una cuota hoy y una línea corta que dice de qué se compone. */
export interface InstallmentOwed {
  amount: number;
  note: string | null;
}

const EPSILON = 0.004;

/**
 * El monto a mostrar de una cuota en un listado: lo que realmente falta pagar (cuota + mora), no solo el monto
 * original de la cuota. La nota aclara cuánto es cuota y cuánto es mora, para que el total no parezca un error.
 */
export function describeInstallmentOwed(installment: Installment): InstallmentOwed {
  const { status, amountDue, amountPaid, penaltyAccrued, penaltyPaid, outstanding, hasPendingDeclaration } = installment;

  if (status === 'PAID') return { amount: amountDue, note: 'pagada' };
  if (status === 'NEGOTIATED') return { amount: amountDue, note: 'refinanciada' };

  const cuotaPending = Math.max(0, amountDue - amountPaid);
  const moraPending = Math.max(0, penaltyAccrued - penaltyPaid);

  if (moraPending > EPSILON) {
    // Con un comprobante en revisión la mora está congelada: no sigue creciendo.
    const frozen = hasPendingDeclaration ? ' (detenida)' : '';
    const note =
      cuotaPending > EPSILON
        ? `cuota ${formatCurrency(cuotaPending)} + mora ${formatCurrency(moraPending)}${frozen}`
        : `solo mora ${formatCurrency(moraPending)}${frozen}`;
    return { amount: outstanding, note };
  }

  if (amountPaid > EPSILON && cuotaPending > EPSILON) {
    return { amount: outstanding, note: `pagaste ${formatCurrency(amountPaid)} de ${formatCurrency(amountDue)}` };
  }

  return { amount: outstanding > 0 ? outstanding : amountDue, note: null };
}
