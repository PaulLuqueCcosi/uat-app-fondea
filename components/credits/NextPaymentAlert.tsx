import Link from 'next/link';
import { AlertCircle, DollarSign, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Installment, NextPayment } from '@/modules/credits';
import { getInstallmentViewStatus } from '@/modules/credits';
import { formatBackendDayMonth } from '@/modules/shared/backend-date';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Ver `modules/shared/backend-date` para el detalle del desfase de zona horaria.
const formatDueDate = formatBackendDayMonth;

// ─── Componente ───────────────────────────────────────────────────────────────

interface NextPaymentAlertProps {
  nextPayment: NextPayment;
  /**
   * La cuota correspondiente en el cronograma. `NextPayment` no trae
   * `hasPendingDeclaration`, así que sin esto no se puede saber si el cliente ya subió su
   * comprobante — y se le mostraría "Cuota vencida, paga ahora" a alguien que ya pagó.
   */
  installment?: Installment;
  creditId: string;
}

/**
 * Alerta de la cuota que toca pagar, compartida entre el dashboard y el detalle del
 * crédito (antes estaba duplicada en las dos vistas, con textos que ya habían empezado a
 * diferir).
 *
 * <p>Contempla tres situaciones: comprobante en revisión (tono neutro, el cliente ya
 * pagó y la mora está detenida), vencida (urgente) y por pagar.
 */
export function NextPaymentAlert({ nextPayment, installment, creditId }: NextPaymentAlertProps) {
  const underReview = installment
    ? getInstallmentViewStatus(installment).status === 'UNDER_REVIEW'
    : false;
  const overdue = nextPayment.isOverdue && !underReview;

  const tone = underReview
    ? { box: 'border-primary-200 bg-primary-50', title: 'text-primary-900', body: 'text-primary-700' }
    : overdue
      ? { box: 'border-error-200 bg-error-50', title: 'text-error-900', body: 'text-error-700' }
      : { box: 'border-warning-200 bg-warning-50', title: 'text-warning-900', body: 'text-warning-700' };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${tone.box}`}>
      {underReview ? (
        <Hourglass className="w-5 h-5 shrink-0 text-primary-600" />
      ) : (
        <AlertCircle className={`w-5 h-5 shrink-0 ${overdue ? 'text-error-600' : 'text-warning-600'}`} />
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${tone.title}`}>
          Cuota {nextPayment.installmentNo} ·{' '}
          {underReview ? 'comprobante en revisión' : overdue ? 'vencida' : 'por pagar'}
        </p>
        <p className={`text-xs ${tone.body}`}>
          {underReview
            ? 'Estamos validando tu pago. La mora está detenida.'
            : overdue
              ? `Venció el ${formatDueDate(nextPayment.dueDate)} · ${formatCurrency(nextPayment.totalToPay)} sin pagar`
              : `Vence el ${formatDueDate(nextPayment.dueDate)} · ${formatCurrency(nextPayment.totalToPay)}`}
        </p>
      </div>

      <Link href={`/dashboard/creditos/${creditId}/cuotas/${nextPayment.installmentNo}`}>
        <Button
          size="sm"
          variant={underReview ? 'outline' : 'default'}
          className={`text-xs shrink-0 gap-1.5 ${
            underReview
              ? ''
              : overdue
                ? 'bg-error-600 text-white hover:bg-error-700'
                : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
          }`}
        >
          {underReview ? (
            'Ver estado'
          ) : (
            <>
              <DollarSign className="w-3.5 h-3.5" />
              Declarar pago
            </>
          )}
        </Button>
      </Link>
    </div>
  );
}
