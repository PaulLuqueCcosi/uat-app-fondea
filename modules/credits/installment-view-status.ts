/**
 * Estado VISIBLE de una cuota para el cliente.
 *
 * <p>El `status` que manda el backend es el estado contable real (lo que ve el admin y lo
 * que alimenta los reportes de cobranza). No siempre es lo que corresponde mostrarle al
 * cliente: si ya subió su comprobante y está esperando validación, el backend mantiene la
 * cuota en OVERDUE — correcto para cobranza — pero mostrarle "Vencida" a alguien que ya
 * pagó y tiene la mora congelada es incorrecto y genera reclamos.
 *
 * <p>Este módulo traduce `status + hasPendingDeclaration` a un único estado de
 * presentación. Existe para que ese criterio viva en UN lugar: antes cada vista
 * (listado de cuotas, detalle de cuota, calendario) armaba su propio Record de labels y
 * variantes, y ya diferían entre sí — NEGOTIATED salía 'warning' en una vista y
 * 'primary' en otra.
 */

import type { Installment } from './credit.types';

export type InstallmentViewStatus =
  | 'PAID'
  | 'UNDER_REVIEW'
  | 'OVERDUE'
  | 'PARTIALLY_PAID'
  | 'CURRENT'
  | 'PENDING'
  | 'NEGOTIATED';

/** Variantes del componente Badge de shadcn (components/ui/badge.tsx). */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'pending' | 'default' | 'completed';

export interface InstallmentViewStatusInfo {
  status: InstallmentViewStatus;
  /** Texto corto para el badge. */
  label: string;
  variant: BadgeVariant;
  /** Frase corta que explica qué significa y, si aplica, qué tiene que hacer el cliente. */
  description: string;
  /** ¿Se puede declarar un pago sobre esta cuota ahora? */
  canDeclarePayment: boolean;
}

/**
 * Resuelve el estado visible. El orden de los checks importa:
 *
 * 1. PAID primero — una cuota pagada nunca es nada más, incluso si quedó una declaración
 *    vieja colgada.
 * 2. NEGOTIATED antes que la revisión — la deuda se movió a otro crédito, no se cobra acá.
 * 3. UNDER_REVIEW antes que OVERDUE — es la razón de ser de este módulo: el cliente ya
 *    pagó y la mora está congelada, no corresponde mostrarle "Vencida".
 */
export function getInstallmentViewStatus(installment: Installment): InstallmentViewStatusInfo {
  const { status, hasPendingDeclaration, daysOverdue } = installment;

  if (status === 'PAID') {
    return {
      status: 'PAID',
      label: 'Pagada',
      variant: 'success',
      description: 'Esta cuota está pagada. No hay nada pendiente.',
      canDeclarePayment: false,
    };
  }

  if (status === 'NEGOTIATED') {
    return {
      status: 'NEGOTIATED',
      label: 'Refinanciada',
      variant: 'default',
      description:
        'Esta cuota se reorganizó en un crédito de refinanciamiento. Se paga desde ahí.',
      canDeclarePayment: false,
    };
  }

  if (hasPendingDeclaration) {
    return {
      status: 'UNDER_REVIEW',
      label: 'En revisión',
      variant: 'pending',
      description:
        'Recibimos tu comprobante y lo estamos validando. La mora está detenida mientras lo revisamos.',
      canDeclarePayment: false,
    };
  }

  if (status === 'OVERDUE') {
    return {
      status: 'OVERDUE',
      label: 'Vencida',
      variant: 'error',
      description:
        daysOverdue > 0
          ? `Venció hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'}. Paga ahora para detener la mora.`
          : 'Esta cuota está vencida. Paga ahora para detener la mora.',
      canDeclarePayment: true,
    };
  }

  if (status === 'PARTIALLY_PAID') {
    return {
      status: 'PARTIALLY_PAID',
      label: 'Pago parcial',
      variant: 'warning',
      description: 'Registramos un pago parcial. Completa el saldo para cerrar la cuota.',
      canDeclarePayment: true,
    };
  }

  if (status === 'CURRENT') {
    return {
      status: 'CURRENT',
      label: 'Por pagar',
      variant: 'warning',
      description: 'Es el turno de esta cuota. Paga antes del vencimiento para evitar mora.',
      canDeclarePayment: true,
    };
  }

  return {
    status: 'PENDING',
    label: 'Futura',
    variant: 'pending',
    description: 'Todavía no vence. Te avisaremos cuando llegue su turno.',
    canDeclarePayment: false,
  };
}

/**
 * Etiqueta de cada estado visible, sin necesitar una cuota.
 *
 * <p>Para leyendas y filtros, donde hay que nombrar el estado sin tener el objeto
 * `Installment` a mano. Antes la leyenda del calendario escribía sus textos a mano y ya
 * había divergido de los badges ("Próxima" vs "Por pagar" para el mismo `CURRENT`).
 */
export const installmentViewStatusLabels: Record<InstallmentViewStatus, string> = {
  PAID: 'Pagada',
  UNDER_REVIEW: 'En revisión',
  OVERDUE: 'Vencida',
  PARTIALLY_PAID: 'Pago parcial',
  CURRENT: 'Por pagar',
  PENDING: 'Futura',
  NEGOTIATED: 'Refinanciada',
};

// Las etiquetas del estado CONTABLE siguen en `credit.types.ts`
// (`installmentStatusLabels`) — las usan las vistas de admin, que necesitan ver la
// realidad del crédito sin la capa de presentación del cliente.
