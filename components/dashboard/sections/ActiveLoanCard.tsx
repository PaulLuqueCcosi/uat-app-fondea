'use client';

import { useState, useEffect } from 'react';
import { CreditCard, ChevronDown, ChevronRight, FileText, ExternalLink, Download, ScrollText, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  InstallmentCalendar,
  CalendarLegend,
  MonthSelector,
  NextPaymentAlert,
} from '@/components/credits';
import { getContractInfoAction, getContractPdfUrlAction } from '@/app/actions/contract.actions';
import type { Credit, Installment, NextPayment, InstallmentViewStatus } from '@/modules/credits';
import { getInstallmentViewStatus } from '@/modules/credits';
import { formatBackendDate, parseBackendDate } from '@/modules/shared/backend-date';

// ─── Estilos por estado visible ───────────────────────────────────────────────

/** Colores de cada fila de la mini-lista, indexados por estado VISIBLE de la cuota. */
const MINI_ROW_STYLES: Record<InstallmentViewStatus, { row: string; dot: string }> = {
  PAID: { row: 'bg-accent-50/50 border-accent-200', dot: 'bg-accent-500' },
  UNDER_REVIEW: { row: 'bg-primary-50/50 border-primary-200', dot: 'bg-primary-400' },
  OVERDUE: { row: 'bg-error-50/50 border-error-200', dot: 'bg-error-500' },
  PARTIALLY_PAID: { row: 'bg-warning-50/50 border-warning-200', dot: 'bg-warning-400' },
  CURRENT: { row: 'bg-warning-50/50 border-warning-200', dot: 'bg-warning-400' },
  NEGOTIATED: { row: 'bg-primary-50/50 border-primary-200', dot: 'bg-primary-500' },
  PENDING: { row: 'border-border hover:bg-neutral-50', dot: 'bg-primary/20' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyShort(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Ver `modules/shared/backend-date`: los LocalDate del backend parseados con `new Date()`
// muestran el día anterior en Perú.
const formatDate = formatBackendDate;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActiveLoanCardProps {
  credit: Credit;
  installments: Installment[];
  nextPayment: NextPayment | null;
  applicationId?: string | null;
}

/**
 * Card de "Tu Préstamo Actual" para el dashboard.
 * Usa Card anatomy (Header/Content/Footer) + Collapsible para cuotas y calendario.
 */
export function ActiveLoanCard({ credit, installments, nextPayment, applicationId }: ActiveLoanCardProps) {
  const progressPercent = credit.totalDue > 0
    ? Math.round((credit.totalPaid / credit.totalDue) * 100)
    : 0;
  const isNegotiation = credit.creditType === 'NEGOTIATION';

  const [expanded, setExpanded] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const initialMonth = installments.find((i) => i.status === 'OVERDUE' || i.status === 'CURRENT' || i.status === 'PENDING');
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    initialMonth ? parseBackendDate(initialMonth.dueDate) : new Date()
  );
  const [visibleMonths, setVisibleMonths] = useState(1);

  // ─── Documentos legales ─────────────────────────────────────────────────────
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [loadingContract, setLoadingContract] = useState(!!applicationId);

  useEffect(() => {
    if (!applicationId) return;
    async function fetchContract() {
      try {
        const contractInfo = await getContractInfoAction(applicationId!);
        if (!contractInfo || contractInfo.status !== 'SIGNED') {
          setLoadingContract(false);
          return;
        }
        const pdfUrl = await getContractPdfUrlAction(applicationId!);
        setContractUrl(pdfUrl);
      } catch (err) {
        console.error('[ActiveLoanCard] Error fetching contract:', err);
      } finally {
        setLoadingContract(false);
      }
    }
    fetchContract();
  }, [applicationId]);

  const termsUrl = process.env.NEXT_PUBLIC_TERMS_URL ?? null;
  const privacyUrl = process.env.NEXT_PUBLIC_PRIVACY_URL ?? null;

  const handleSelectInstallment = (inst: Installment) => {
    if (selectedInstallment?.id === inst.id) {
      setSelectedInstallment(null);
      return;
    }
    setSelectedInstallment(inst);
    const instDate = parseBackendDate(inst.dueDate);
    const startMonth = calendarMonth.getMonth();
    const startYear = calendarMonth.getFullYear();
    let isVisible = false;
    for (let i = 0; i < visibleMonths; i++) {
      const m = (startMonth + i) % 12;
      const y = startYear + Math.floor((startMonth + i) / 12);
      if (instDate.getMonth() === m && instDate.getFullYear() === y) {
        isVisible = true;
        break;
      }
    }
    if (!isVisible) setCalendarMonth(instDate);
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {isNegotiation ? 'Crédito de refinanciamiento' : 'Tu préstamo actual'}
              {isNegotiation && <Badge variant="warning">Refinanciamiento</Badge>}
            </span>
          </CardTitle>
          <CardDescription>
            {formatCurrencyShort(credit.principal)} · {credit.installmentCount} cuotas
          </CardDescription>
          <CardAction>
            <CollapsibleTrigger className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer">
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${expanded ? '' : 'rotate-180'}`}
              />
            </CollapsibleTrigger>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ─── Alerta próximo pago ───
              Componente compartido con el detalle del crédito — antes este bloque estaba
              duplicado en ambas vistas. */}
          {nextPayment && (
            <NextPaymentAlert
              nextPayment={nextPayment}
              installment={installments.find((i) => i.installmentNo === nextPayment.installmentNo)}
              creditId={credit.id}
            />
          )}

          {/* ─── Progreso del préstamo ─── */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Progreso del préstamo</p>
              <p className="text-sm font-bold text-foreground">{progressPercent}% completado</p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="rounded-md border border-border bg-background p-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                <p className="text-base font-bold text-foreground">
                  {formatCurrencyShort(credit.totalDue)}
                </p>
              </div>
              <div className="rounded-md border border-accent-200 bg-accent-50 p-2.5">
                <p className="text-xs text-accent-800 mb-0.5">Pagado</p>
                <p className="text-base font-bold text-accent-700">
                  {formatCurrencyShort(credit.totalPaid)}
                </p>
              </div>
              <div className="rounded-md border border-error-200 bg-error-50 p-2.5">
                <p className="text-xs text-error-700 mb-0.5">Pendiente</p>
                <p className="text-base font-bold text-error-700">
                  {formatCurrencyShort(credit.totalOutstanding)}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Cuotas + Calendario (colapsable) ─── */}
          <CollapsibleContent>
            {installments.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch pt-2">
                {/* Lista mini de cuotas */}
                <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cuotas ({installments.length})
                  </p>
                  <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: '336px' }}>
                    {installments.map((inst) => {
                      // Estado visible: con comprobante en revisión no se pinta de rojo.
                      const view = getInstallmentViewStatus(inst);
                      const style = MINI_ROW_STYLES[view.status];
                      return (
                        <button
                          key={inst.id}
                          onClick={() => handleSelectInstallment(inst)}
                          className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 border text-left transition-all hover:ring-1 hover:ring-primary/20 ${style.row} ${
                            selectedInstallment?.id === inst.id ? 'ring-2 ring-primary' : ''
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold text-white ${style.dot}`}>
                            {inst.installmentNo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground leading-tight">
                              Cuota {inst.installmentNo}
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                              {view.status === 'NEGOTIATED' ? 'Refinanciada'
                                : view.status === 'UNDER_REVIEW' ? 'En revisión'
                                : formatDate(inst.dueDate)}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-foreground shrink-0">
                            {formatCurrencyShort(inst.amountDue)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calendario */}
                <div className="rounded-lg border border-border p-3 flex flex-col gap-2 h-full">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Calendario de pagos
                  </p>
                  <div className="flex-1 flex items-center justify-center overflow-x-auto">
                    <InstallmentCalendar
                      installments={installments}
                      selectedInstallment={selectedInstallment}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      onDayClick={handleSelectInstallment}
                      numberOfMonths={visibleMonths}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <CalendarLegend />
                    <MonthSelector value={visibleMonths} onChange={setVisibleMonths} options={[1, 2]} />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Documentos legales ─── */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
              <span className="text-sm font-medium text-foreground mr-1">Documentos:</span>

              {loadingContract ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Contrato
                </span>
              ) : contractUrl ? (
                <a
                  href={contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <ScrollText className="w-4 h-4" />
                  Contrato
                  <Download className="w-4 h-4" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/25 text-sm text-primary/60">
                  <ScrollText className="w-4 h-4" />
                  Contrato
                </span>
              )}

              {termsUrl && (
                <a
                  href={termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Términos y condiciones
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {privacyUrl && (
                <a
                  href={privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Política de privacidad
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3">
          <Link
            href={`/dashboard/creditos/${credit.id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Ver detalle del crédito
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          {isNegotiation && credit.originCreditId && (
            <Link
              href={`/dashboard/creditos/${credit.originCreditId}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Ver crédito original
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </CardFooter>
      </Card>
    </Collapsible>
  );
}
