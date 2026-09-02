/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Info centralizada de las métricas del dashboard admin.
 *
 * Cada entrada explica QUÉ representa la métrica y CÓMO se calcula. El texto de
 * `calculation` y `notes` admite varias líneas: usa `\n` para saltos y `- ` al
 * inicio de línea para viñetas (el componente MetricInfoButton las renderiza).
 *
 * Para editar la explicación de cualquier métrica, SOLO se toca este archivo.
 * Cada MetricCard se conecta pasando su `metricKey`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface MetricInfo {
  /** Nombre de la métrica (encabezado del popover). */
  title: string;
  /** Qué representa, en 1-2 frases. */
  what: string;
  /** Cómo se calcula. Puede ser largo — admite saltos de línea y viñetas `- `. */
  calculation: string;
  /** Exclusiones, casos especiales, notas pendientes. Opcional. */
  notes?: string;
}

export type MetricKey =
  | 'activeLoans'
  | 'capitalDisponible'
  | 'utilizacion'
  | 'npl'
  | 'nplTranches'
  | 'income'
  | 'cashflow'
  | 'nps'
  | 'funnel'
  | 'activeClients'
  | 'repurchaseRate'
  | 'cityDistribution';

export const METRIC_INFO: Record<MetricKey, MetricInfo> = {
  activeLoans: {
    title: 'Préstamos activos',
    what: 'Número de créditos vigentes y el capital total colocado en ellos.',
    calculation:
      'count = COUNT de créditos con credit_type = STANDARD y status IN (ACTIVE, OVERDUE).\n' +
      'total_principal = SUM(principal) de esos mismos créditos.',
    notes:
      'Los créditos de NEGOCIACIÓN se excluyen a propósito: no son capital nuevo desembolsado, son deuda ya existente reempaquetada.',
  },

  capitalDisponible: {
    title: 'Capital disponible',
    what: 'Dinero disponible para seguir prestando, según el saldo bancario real.',
    calculation:
      'available = Fund.bankBalance — el saldo BANCARIO REAL sincronizado desde el banco (NO un cálculo de total_capital − deployed).\n' +
      'total_capital = Fund.capitalBase (capital total aportado al fondo).\n' +
      'deployed = SUM(principal) de créditos STANDARD activos (igual que Préstamos activos).\n' +
      'Semáforo (calculado en el frontend con available / total_capital):\n' +
      '- Verde: más de 30% libre\n' +
      '- Amarillo: entre 15% y 30%\n' +
      '- Rojo: menos de 15%',
    notes:
      'Si la última sincronización con el banco está desactualizada (>30 min), este número puede no coincidir exacto con total_capital − deployed. El backend no manda color/estado, solo los 3 montos.',
  },

  utilizacion: {
    title: 'Tasa de utilización',
    what: 'Qué porcentaje del capital del fondo está efectivamente colocado en préstamos.',
    calculation:
      'utilization_rate = deployed / capitalBase × 100 (calculado en el backend, Fund.calculateUtilizationRate).\n' +
      'Semáforo del medidor:\n' +
      '- Verde: 70% o más\n' +
      '- Amarillo: entre 40% y 70%\n' +
      '- Rojo: menos de 40%',
    notes:
      'Si es muy bajo, la cartera no está rotando bien: mucho capital ocioso sin prestar.',
  },

  npl: {
    title: 'Tasa de Mora (NPL)',
    what: 'Porcentaje del capital colocado que está en mora, en general y desglosado por plazo.',
    calculation:
      'general_rate = overdue_capital / active_capital × 100.\n' +
      '- active_capital = SUM(principal) de créditos STANDARD con status IN (ACTIVE, OVERDUE).\n' +
      '- overdue_capital = SUM(principal) de créditos STANDARD con status = OVERDUE.\n' +
      'Por plazo: npl_rate = overdue_principal / total_principal × 100, calculado por separado para cada plazo (termDays) seleccionado.\n' +
      'Los plazos pedidos sin créditos en BD igual aparecen, con 0/0 = 0%.',
    notes:
      'Créditos de NEGOCIACIÓN excluidos (mismo criterio que Préstamos activos). Los plazos seleccionables vienen del catálogo real del producto (fondea-calculator-service), no están hardcodeados. Métrica independiente de "NPL por Etapa de Cobranza".',
  },

  nplTranches: {
    title: 'NPL por Etapa de Cobranza',
    what: 'Distribución de las cuotas en mora entre 7 etapas de cobranza, según cuántos días llevan atrasadas.',
    calculation:
      'Denominador = total_overdue_installments = COUNT de TODAS las cuotas con status = OVERDUE, de créditos STANDARD con status IN (ACTIVE, OVERDUE).\n' +
      'Cada cuota vencida cae en EXACTAMENTE una etapa según su propio daysOverdue:\n' +
      '- 1-4d: Mora temprana A\n' +
      '- 5-8d: Mora temprana B\n' +
      '- 9-15d: Cobranza activa temprana\n' +
      '- 16-30d: Cobranza activa intermedia\n' +
      '- 31-60d: Cobranza tardía\n' +
      '- 61-90d: Precastigo\n' +
      '- 91d+: Castigo (sin límite superior)\n' +
      'percentage = cuotas de la etapa / total_overdue_installments × 100 (las 7 etapas SIEMPRE suman 100%).\n' +
      'installment_amount = SUM(amount_due − amount_paid) de esas cuotas (monto real pendiente de la cuota, no el principal del crédito).',
    notes:
      'Se mide a nivel de CUOTA, no de préstamo. Excluye créditos ya castigados/suspendidos y de NEGOCIACIÓN. Métrica independiente del NPL general (distinto denominador).',
  },

  income: {
    title: 'Ingresos brutos acumulados',
    what: 'Estimación de la ganancia por intereses cobrada en el periodo (solo la porción de interés, no el capital devuelto).',
    calculation:
      'accumulated_income = SUM(cuotas pagadas en los últimos N días) × interestRatio.\n' +
      'income_today = igual, pero solo lo cobrado hoy.\n' +
      'interestRatio = promedio de (totalDue − principal) / totalDue entre los créditos activos: una ESTIMACIÓN de qué % de cada pago recibido es interés vs. capital devuelto.',
    notes:
      'Es una estimación por ratio promedio, no usa el desglose real por cuota (interest_amount / principal_amount) aunque ese dato ya exista en el dominio. Distinto de "Ingresos a caja", que cuenta todo lo cobrado sin filtrar interés.\n' +
      'A diferencia de Préstamos activos/NPL/Capital (que excluyen NEGOCIACIÓN), tanto el monto cobrado como el interestRatio de este KPI SÍ incluyen pagos de créditos de NEGOCIACIÓN — no hay filtro credit_type acá.',
  },

  cashflow: {
    title: 'Ingresos a caja (total)',
    what: 'Todo el dinero que entró a caja en el periodo: capital devuelto + intereses, sin filtrar.',
    calculation:
      'accumulated = SUM(cuotas pagadas en los últimos N días) — TODO lo cobrado (capital e interés juntos).\n' +
      'today = igual, pero solo lo cobrado hoy (fecha del servidor).',
    notes:
      'Indicador de salud diaria de caja: cuánta plata entró, sin distinguir devolución de capital de ganancia real. A diferencia de "Ingresos brutos", que solo cuenta la porción de interés.\n' +
      'Igual que en Ingresos brutos, esta suma incluye pagos de créditos de NEGOCIACIÓN (no hay filtro credit_type) — a diferencia de Préstamos activos/NPL/Capital, que sí excluyen NEGOCIACIÓN.',
  },

  nps: {
    title: 'NPS (Net Promoter Score)',
    what: 'Indicador de satisfacción del cliente del mes elegido, de −100 a 100.',
    calculation:
      'nps_score = % promotores − % detractores de las respuestas del mes.\n' +
      'Encuesta "¿qué tan probable es que recomiendes Fondea?", escala 0-10:\n' +
      '- Promotor: 9-10\n' +
      '- Pasivo: 7-8\n' +
      '- Detractor: 0-6\n' +
      'trend_delta = nps_score del mes elegido − nps_score del mes inmediato anterior.',
    notes:
      'trend_delta es null si el mes anterior todavía no tiene respuestas.',
  },

  funnel: {
    title: 'Funnel de Conversión',
    what: 'Recorrido de los usuarios desde que muestran intención hasta que se les desembolsa el crédito.',
    calculation:
      '4 etapas, cada una de una fuente distinta:\n' +
      '- Intenciones = intenciones de usuario creadas (antes de KYC/formularios)\n' +
      '- Enviadas = eventos SUBMITTED (KYC + formularios ya aprobados, requisito bloqueante del envío)\n' +
      '- Aprobadas = eventos PRE_APPROVED (evaluación crediticia OK)\n' +
      '- Desembolsadas = eventos DISBURSED (crédito creado, dinero enviado)\n' +
      'overall_conversion_rate = Desembolsadas / Intenciones × 100.',
    notes:
      'No hay etapa "KYC ok" separada: el KYC es requisito bloqueante antes de enviar, así que "Enviadas" ya lo implica. Es un funnel "mini" (4 etapas); el dominio interno tiene más. Los checkboxes son solo de UI: el backend siempre trae las 4 etapas.',
  },

  activeClients: {
    title: 'Clientes activos',
    what: 'Clientes distintos con al menos un préstamo vigente creado en el periodo.',
    calculation:
      'count = clientes (usuarios) DISTINTOS con al menos un crédito status IN (ACTIVE, OVERDUE), credit_type = STANDARD, creado desde hace N días.',
    notes:
      'Corregido (2026-08-18): ahora filtra credit_type = STANDARD (antes contaba créditos de NEGOCIACIÓN). Pendiente con negocio: el brief pide "activo O desembolsado desde hace N días" (OR); la query es "activo Y creado desde hace N días" (AND).',
  },

  repurchaseRate: {
    title: 'Tasa de recompra',
    what: 'Porcentaje de clientes activos que ya habían tenido y cerrado un crédito antes (clientes que repiten).',
    calculation:
      'rate = repeat_clients / active_clients × 100.\n' +
      'active_clients = mismo cálculo que "Clientes activos" (con filtro STANDARD).\n' +
      'repeat_clients = clientes con un crédito ACTIVE (STANDARD) desembolsado en [from, to] que TAMBIÉN tienen otro crédito PAID_OFF (STANDARD) cerrado en esa misma ventana.',
    notes:
      'Corregido (2026-08-18): la ventana usa BETWEEN :from AND :to en ambas condiciones y filtra credit_type = STANDARD. Verificado contra la BD real.',
  },

  cityDistribution: {
    title: 'Distribución Geográfica',
    what: 'Cómo se reparten los préstamos activos por departamento del Perú.',
    calculation:
      'Cuenta de créditos activos agrupados por departamento (prefijo del código ubigeo). Las provincias se agrupan bajo su departamento.\n' +
      'percentage = préstamos del departamento / total_loans × 100.',
    notes:
      'Solo aparecen créditos credit_type = STANDARD con ubigeo_region / ubigeo_province cargado. En dev la mayoría de créditos de prueba no tienen ubigeo, así que es normal ver pocos departamentos.',
  },
};
