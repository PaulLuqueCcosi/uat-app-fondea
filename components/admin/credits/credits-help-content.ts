/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Contenido centralizado del modal de ayuda "¿Cómo funcionan los créditos?"
 * en /admin/credits. Espejo fiel del dominio real (Credit.java, CreditStatus.java,
 * CreditType.java, Installment.java, InstallmentStatus.java, KpiService.java —
 * backend_plataforma).
 *
 * Para editar cualquier explicación, SOLO se toca este archivo. El texto largo
 * admite `\n` para saltos de línea y `- ` al inicio de línea para viñetas
 * (mismo formato que metric-info.ts, renderizado por FormattedBlock).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Tipos de crédito ──────────────────────────────────────────────────────────

export interface CreditTypeInfo {
  code: 'STANDARD' | 'NEGOTIATION';
  label: string;
  what: string;
  details: string;
}

export const CREDIT_TYPES: CreditTypeInfo[] = [
  {
    code: 'STANDARD',
    label: 'Crédito estándar',
    what: 'El crédito normal: se origina desde una solicitud aprobada y representa dinero nuevo desembolsado.',
    details:
      'Viene de una LoanApplication (solicitud) evaluada y aprobada.\n' +
      'El plazo (termDays) es un valor de catálogo del producto: 7, 15 o 30 días.\n' +
      'Sí desembolsa dinero real: mueve el fondo de capital al confirmarse.\n' +
      'Tiene tasa de interés propia, definida por el producto.\n' +
      'Genera ganancia real por interés, que se reporta al fondo de capital al liquidarse.',
  },
  {
    code: 'NEGOTIATION',
    label: 'Crédito de negociación',
    what: 'Un crédito creado por un admin para refinanciar una cuota en mora de otro crédito. Sigue siendo un crédito normal en todo lo demás (mismas cuotas, misma mora, mismo ciclo de vida).',
    details:
      'No viene de una solicitud: nace de una cuota vencida de otro crédito (la "cuota origen").\n' +
      'El plazo NO es 7/15/30 — se calcula de las fechas del cronograma que el admin arma a mano.\n' +
      'No desembolsa dinero nuevo: no mueve el fondo de capital (es deuda ya existente, reempaquetada).\n' +
      'No tiene tasa de interés propia — el admin define manualmente cuánto y cuándo se paga. Por defecto sus cuotas son 100% capital, 0% interés.\n' +
      'No genera ganancia propia: la ganancia real de toda la cadena ya quedó contabilizada en el crédito estándar que la originó.\n' +
      'Puede encadenarse: una negociación puede a su vez negociar una de sus propias cuotas. El sistema siempre sabe cuál es la raíz (el crédito estándar original de toda la cadena).',
  },
];

export const CREDIT_TYPES_NOTE =
  'Los KPIs de cartera, mora y clientes activos excluyen los créditos de negociación a propósito: no son colocación nueva, y contarlos junto con los estándar infla artificialmente esas métricas.';

// ─── Estados del crédito ───────────────────────────────────────────────────────

export interface CreditStatusFlowInfo {
  code: string;
  triggeredBy: string;
}

/** Complementa la descripción visual (label/color) que ya vive en credit-status-labels.ts — acá solo se agrega CÓMO se llega y CÓMO se sale de cada estado. */
export const CREDIT_STATUS_FLOW: CreditStatusFlowInfo[] = [
  {
    code: 'PENDING_DISBURSEMENT',
    triggeredBy:
      'Se crea así al aprobarse la solicitud. Pasa a Activo cuando se confirma el desembolso. Mientras está en este estado: no acumula mora, no recibe pagos, no se puede negociar.',
  },
  {
    code: 'ACTIVE',
    triggeredBy:
      'Se llega acá tras el desembolso, o al ponerse al día después de estar Vencido. El sistema lo revisa todos los días a las 6:00 am: si alguna cuota vence, pasa a Vencido automáticamente.',
  },
  {
    code: 'OVERDUE',
    triggeredBy:
      'El sistema lo marca así en cuanto una cuota pasa su fecha de vencimiento (revisión diaria 6:00 am). Vuelve a Activo automáticamente en cuanto se pagan o negocian todas las cuotas vencidas.',
  },
  {
    code: 'SUSPENDED',
    triggeredBy:
      'Solo por acción manual de un admin (fraude, disputa, orden judicial). Mientras está suspendido no acumula mora, rechaza cualquier pago (incluye depósitos del cliente pendientes de aprobar) y no se puede negociar. Solo otro admin puede reactivarlo — no hay salida automática.',
  },
  {
    code: 'WRITTEN_OFF',
    triggeredBy:
      'Solo por acción manual de un admin — es el castigo contable (se reconoce la pérdida y sale del balance activo). A diferencia de Suspendido, SÍ puede recuperarse solo, sin que un admin intervenga: si el cliente paga voluntariamente, vuelve a Vencido o Liquidado según cuánto pague, y la parte de la pérdida que corresponda se revierte automáticamente en el fondo de capital. No se puede negociar mientras está en este estado.',
  },
  {
    code: 'PAID_OFF',
    triggeredBy:
      'Estado final. Se llega acá en cuanto todas las cuotas quedan resueltas — pagadas directamente o trasladadas a un crédito de negociación. No hay salida: de acá no se vuelve a mover.',
  },
];

export const CREDIT_STATUS_DIAGRAM =
  'Por desembolsar → Activo ⇄ Vencido → Liquidado\n' +
  'Activo o Vencido → Suspendido → (solo un admin lo reactiva) → Activo\n' +
  'Vencido → Castigado → (pago del cliente) → Vencido o Liquidado';

export const CREDIT_STATUS_ACTIONS_NOTE =
  'Suspender, reactivar y castigar un crédito son operaciones manuales, disponibles solo desde el detalle de un crédito específico (no desde la tabla ni en bulk) — cada una pide confirmación explícita y queda registrada en el Timeline con el admin que la ejecutó.\n' +
  '- Suspender: disponible salvo si el crédito ya está Liquidado o Suspendido. Requiere motivo obligatorio.\n' +
  '- Reactivar: solo disponible si el crédito está Suspendido.\n' +
  '- Castigar: solo disponible si el crédito está Vencido. Reporta la pérdida al fondo de capital de inmediato. Si el crédito se recupera después con pagos del cliente, la parte de esa pérdida que corresponda se revierte automáticamente en el fondo — no requiere ajuste manual.';

// ─── Cuotas ────────────────────────────────────────────────────────────────────

export interface InstallmentStatusFlowInfo {
  code: string;
  triggeredBy: string;
}

export const INSTALLMENT_STATUS_FLOW: InstallmentStatusFlowInfo[] = [
  {
    code: 'PENDING',
    triggeredBy: 'Así nace cada cuota al crear el crédito. Pasa a "Por pagar" en cuanto llega su fecha de vencimiento.',
  },
  {
    code: 'CURRENT',
    triggeredBy: 'Es la cuota que corresponde pagar ahora. Si se paga completa antes de vencer, pasa a Pagada. Si vence sin pagarse, pasa a Vencida.',
  },
  {
    code: 'PARTIALLY_PAID',
    triggeredBy: 'Recibió un pago que no la cubre completa (puede estar vencida o no). Se completa a Pagada con el resto del pago.',
  },
  {
    code: 'OVERDUE',
    triggeredBy: 'Pasó su fecha de vencimiento sin completarse el pago. Acumula mora todos los días desde entonces. Sale de este estado si se paga completa (Pagada) o si se refinancia (Refinanciada).',
  },
  {
    code: 'PAID',
    triggeredBy: 'Estado final de la cuota — saldada por completo, incluyendo la mora acumulada si tenía.',
  },
  {
    code: 'NEGOTIATED',
    triggeredBy: 'Estado final de la cuota — su deuda se trasladó a un crédito de negociación nuevo. Ya no se cobra directamente desde el crédito original.',
  },
];

export const INSTALLMENT_CALCULATION =
  'amountDue: el monto fijo de la cuota, definido en el cronograma al crear el crédito. No cambia.\n' +
  'principalAmount / interestAmount: la parte de capital y de interés de esa cuota. Se calculan una sola vez al crear la cuota, aplicando el mismo % de interés que tiene el crédito completo (la tasa es plana, no decrece con el tiempo). En cuotas de negociación, por defecto es 100% capital y 0% interés.\n' +
  'amountPaid: lo que el cliente ya pagó de esa cuota (capital + interés pagado).\n' +
  'Saldo pendiente de la cuota: (amountDue + mora acumulada) − (amountPaid + mora pagada). Nunca es negativo.\n' +
  'daysOverdue: días de atraso, actualizado automáticamente todos los días por el sistema.';

export const INSTALLMENT_NOTE =
  'El pendiente TOTAL del crédito (el que se muestra en el resumen) es un valor calculado directamente por el sistema — no es la suma manual de los pendientes de cada cuota. Una cuota Refinanciada queda con su saldo "congelado" en el detalle, y sumarla de nuevo infla el pendiente real.';

// ─── Mora y cobranza (7 etapas) ────────────────────────────────────────────────

export interface MoraStageInfo {
  key: string;
  label: string;
  minDays: number;
  maxDays: number | null;
  color: string;
}

/** Mismos 7 rangos y colores que el KPI "NPL por Etapa de Cobranza" (backend KpiService.java). */
export const MORA_STAGES: MoraStageInfo[] = [
  { key: 'MORA_TEMPRANA_A', label: 'Mora temprana A', minDays: 1, maxDays: 4, color: '#a3e635' },
  { key: 'MORA_TEMPRANA_B', label: 'Mora temprana B', minDays: 5, maxDays: 8, color: '#eab308' },
  { key: 'COBRANZA_ACTIVA_TEMPRANA', label: 'Cobranza activa temprana', minDays: 9, maxDays: 15, color: '#f59e0b' },
  { key: 'COBRANZA_ACTIVA_INTERMEDIA', label: 'Cobranza activa intermedia', minDays: 16, maxDays: 30, color: '#f97316' },
  { key: 'COBRANZA_TARDIA', label: 'Cobranza tardía', minDays: 31, maxDays: 60, color: '#ef4444' },
  { key: 'PRECASTIGO', label: 'Precastigo', minDays: 61, maxDays: 90, color: '#b91c1c' },
  { key: 'CASTIGO', label: 'Castigo (días)', minDays: 91, maxDays: null, color: '#450a0a' },
];

export const MORA_STAGES_NOTE =
  'Estas 7 etapas se miden a nivel de CUOTA, no de crédito completo: cada cuota vencida cae en exactamente una etapa según sus propios días de atraso. Un crédito puede tener cuotas en distintas etapas a la vez.\n' +
  '"Castigo" acá es solo la etapa de días (91+) — NO es lo mismo que el estado "Castigado" (Written Off) del crédito. Una cuota puede llevar más de 91 días de atraso y el crédito seguir en estado Vencido: el castigo contable real requiere que un admin lo marque manualmente.';
