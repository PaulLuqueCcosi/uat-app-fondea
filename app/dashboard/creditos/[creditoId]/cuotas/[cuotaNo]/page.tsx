'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  CreditCard,
  Smartphone,
  Shield,
  XCircle,
  Loader2,
  PartyPopper,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  getInstallmentByNoAction,
  getCreditByIdAction,
  payInstallmentAction,
} from '@/app/actions/credit.actions';
import type {
  Installment,
  InstallmentStatus,
  Credit,
  PaymentMethod,
  PaymentResult,
} from '@/modules/credits';
import { installmentStatusLabels } from '@/modules/credits';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const badgeVariants: Record<InstallmentStatus, 'success' | 'warning' | 'error' | 'pending'> = {
  PAID: 'success',
  NEGOTIATED: 'warning',
  CURRENT: 'warning',
  PARTIALLY_PAID: 'warning',
  PENDING: 'pending',
  OVERDUE: 'error',
};

// ─── Payment method config ────────────────────────────────────────────────────

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
  iconBg: string;
  iconColor: string;
  recommended?: boolean;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'YAPE',
    label: 'Yape',
    description: 'Billetera digital BCP',
    icon: Smartphone,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    recommended: true,
  },
  {
    id: 'PLIN',
    label: 'Plin',
    description: 'Billetera digital Interbank',
    icon: Smartphone,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Transferencia bancaria',
    description: 'BCP, Interbank, BBVA, Scotiabank',
    icon: DollarSign,
    iconBg: 'bg-accent-50',
    iconColor: 'text-accent-800',
  },
  {
    id: 'DEBIT_CARD',
    label: 'Tarjeta de débito',
    description: 'Visa, Mastercard',
    icon: CreditCard,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
];

// ─── Payment flow steps ───────────────────────────────────────────────────────

type PaymentStep = 'select-method' | 'confirm' | 'processing' | 'success' | 'error';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CuotaDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-4 w-36 bg-neutral-200 rounded" />
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-neutral-200 rounded" />
        <div className="h-5 w-20 bg-neutral-200 rounded-full" />
      </div>
      <div className="h-20 bg-neutral-100 rounded-xl border" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-neutral-100 rounded-xl border" />
        <div className="h-56 bg-neutral-100 rounded-xl border" />
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CuotaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const cuotaNo = Number(params.cuotaNo);
  const creditoId = params.creditoId as string;

  const [cuota, setCuota] = useState<Installment | null>(null);
  const [credit, setCredit] = useState<Credit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select-method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const [cuotaRes, creditRes] = await Promise.all([
        getInstallmentByNoAction(creditoId, cuotaNo),
        getCreditByIdAction(creditoId),
      ]);
      if (cuotaRes.ok) {
        setCuota(cuotaRes.data);
      } else {
        setError(cuotaRes.error.message);
      }
      if (creditRes.ok) {
        setCredit(creditRes.data);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [creditoId, cuotaNo]);

  // ─── Payment handler ──────────────────────────────────────────────────────

  async function handleConfirmPayment() {
    if (!selectedMethod || !cuota) return;

    setPaymentStep('processing');
    setPaymentError(null);

    const result = await payInstallmentAction(creditoId, cuotaNo, {
      amount: cuota.outstanding,
      paymentMethod: selectedMethod,
      referenceNumber: referenceNumber || undefined,
      source: 'manual',
    });

    if (result.ok) {
      setPaymentResult(result.data);
      setPaymentStep('success');
    } else {
      setPaymentError(result.error.message);
      setPaymentStep('error');
    }
  }

  if (loading) return <CuotaDetailSkeleton />;

  if (error || !cuota) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <CreditCard className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error ?? 'Cuota no encontrada'}</p>
        <Link href={`/dashboard/creditos/${creditoId}/cuotas`}>
          <Button variant="outline" size="sm">Volver al cronograma</Button>
        </Link>
      </div>
    );
  }

  const isPaid = cuota.status === 'PAID';
  const isOverdue = cuota.status === 'OVERDUE';
  // Se puede pagar si tiene saldo pendiente (el backend valida el orden)
  const needsPayment = cuota.outstanding > 0;
  const totalInstallments = credit?.installmentCount ?? 0;
  const totalToPay = cuota.outstanding;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* ─── Navegación ─── */}
      <Link
        href={`/dashboard/creditos/${creditoId}/cuotas`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Cronograma de cuotas
      </Link>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Cuota {cuota.installmentNo} de {totalInstallments}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Crédito #{creditoId.slice(-6)}</p>
        </div>
        <Badge variant={badgeVariants[cuota.status]}>
          {installmentStatusLabels[cuota.status]}
        </Badge>
      </div>

      {/* ─── Banner de estado ─── */}
      {isPaid && paymentStep !== 'success' && (
        <Card className="border-success-200 bg-success-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-success-900">
              <CheckCircle className="w-4 h-4 text-success-700" />
              Cuota pagada
            </CardTitle>
            <CardDescription className="text-success-700">
              Pagada el {cuota.paidAt ? formatDate(cuota.paidAt) : '—'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {cuota.status === 'CURRENT' && paymentStep === 'select-method' && (
        <Card className="border-warning-200 bg-warning-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-warning-900">
              <Clock className="w-4 h-4 text-warning-700" />
              Pago pendiente
            </CardTitle>
            <CardDescription className="text-warning-700">
              Vence el {formatDate(cuota.dueDate)}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {cuota.status === 'PARTIALLY_PAID' && paymentStep === 'select-method' && (
        <Card className="border-warning-200 bg-warning-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-warning-900">
              <Clock className="w-4 h-4 text-warning-700" />
              Pago parcial — faltan {formatCurrency(cuota.outstanding)}
            </CardTitle>
            <CardDescription className="text-warning-700">
              Vence el {formatDate(cuota.dueDate)} · Ya pagaste {formatCurrency(cuota.amountPaid)}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {isOverdue && paymentStep === 'select-method' && (
        <Card className="border-error-200 bg-error-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-error-900">
              <AlertCircle className="w-4 h-4 text-error-600" />
              Cuota vencida — {cuota.daysOverdue} días de atraso
            </CardTitle>
            <CardDescription className="text-error-700">
              Venció el {formatDate(cuota.dueDate)}. Paga lo antes posible.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {cuota.status === 'PENDING' && paymentStep === 'select-method' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Cuota futura
            </CardTitle>
            <CardDescription>
              Vence el {formatDate(cuota.dueDate)} — puedes adelantar el pago si la cuota anterior está al día
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* ─── Layout 2 columnas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Columna izquierda: Desglose ── */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Desglose
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">Monto de cuota</span>
                <span className="text-sm font-medium text-foreground">{formatCurrency(cuota.amountDue)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">Ya pagado</span>
                <span className="text-sm font-medium text-accent-700">{formatCurrency(cuota.amountPaid)}</span>
              </div>
              {cuota.penaltyAccrued > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Mora ({cuota.daysOverdue} días)
                  </span>
                  <span className="text-sm font-medium text-error-600">{formatCurrency(cuota.penaltyAccrued)}</span>
                </div>
              )}
              {cuota.penaltyPaid > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Mora pagada</span>
                  <span className="text-sm font-medium text-accent-700">{formatCurrency(cuota.penaltyPaid)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-base font-semibold text-foreground">Pendiente</span>
                <span className="text-xl font-bold text-foreground">{formatCurrency(cuota.outstanding)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Advertencia si vencida */}
          {isOverdue && paymentStep === 'select-method' && (
            <Card className="border-error-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-error-900">
                  <XCircle className="w-4 h-4 text-error-600" />
                  Consecuencias del atraso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-error-700 space-y-1">
                  <li>• Mora de {formatCurrency(cuota.penaltyAccrued)} por {cuota.daysOverdue} días</li>
                  <li>• A los 5 días se reporta a centrales de riesgo</li>
                  <li>• A los 15 días se bloquea tu línea de crédito</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Columna derecha: Flujo de pago ── */}
        <div className="flex flex-col gap-6">
          {/* STEP: Select method */}
          {needsPayment && paymentStep === 'select-method' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Pagar esta cuota
                </CardTitle>
                <CardDescription>Selecciona tu método de pago</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full flex items-center gap-3 rounded-lg border p-3 transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${method.iconBg}`}>
                        <Icon className={`w-5 h-5 ${method.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                      {method.recommended && (
                        <Badge variant="outline" className="text-[9px] shrink-0">Popular</Badge>
                      )}
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}

                {/* Reference number (optional) */}
                {selectedMethod && (
                  <div className="pt-2 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nº de operación (opcional)
                    </label>
                    <Input
                      placeholder="Ej: OP-2026081500123"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                )}

                <Separator />

                <Button
                  onClick={() => setPaymentStep('confirm')}
                  disabled={!selectedMethod}
                  className={`w-full gap-2 h-11 font-semibold ${
                    isOverdue
                      ? 'bg-error-600 text-white hover:bg-error-700 disabled:bg-error-300'
                      : 'bg-accent-500 text-accent-900 hover:bg-accent-400 disabled:bg-accent-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Continuar · {formatCurrency(totalToPay)}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STEP: Confirm payment */}
          {needsPayment && paymentStep === 'confirm' && selectedMethod && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Confirmar pago
                </CardTitle>
                <CardDescription>Revisa los datos antes de confirmar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-neutral-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cuota</span>
                    <span className="text-sm font-medium text-foreground">
                      #{cuota.installmentNo} de {totalInstallments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Método</span>
                    <span className="text-sm font-medium text-foreground">
                      {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label}
                    </span>
                  </div>
                  {referenceNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Referencia</span>
                      <span className="text-sm font-mono text-foreground">{referenceNumber}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">Total a pagar</span>
                    <span className="text-xl font-bold text-foreground">{formatCurrency(totalToPay)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPaymentStep('select-method')}
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleConfirmPayment}
                    className={`flex-1 gap-2 font-semibold ${
                      isOverdue
                        ? 'bg-error-600 text-white hover:bg-error-700'
                        : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Confirmar pago
                  </Button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground">
                  Al confirmar, se registrará el pago en el sistema.
                </p>
              </CardContent>
            </Card>
          )}

          {/* STEP: Processing */}
          {paymentStep === 'processing' && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium text-foreground">Procesando pago...</p>
                  <p className="text-xs text-muted-foreground">No cierres esta página</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP: Success */}
          {paymentStep === 'success' && paymentResult && (
            <Card className="border-success-200 bg-success-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-success-900">
                  <PartyPopper className="w-5 h-5 text-success-700" />
                  ¡Pago registrado!
                </CardTitle>
                <CardDescription className="text-success-700">
                  Tu pago se procesó correctamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-success-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monto aplicado</span>
                    <span className="text-sm font-bold text-success-700">
                      {formatCurrency(paymentResult.totalApplied)}
                    </span>
                  </div>
                  {paymentResult.remaining > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sobrante</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(paymentResult.remaining)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado del crédito</span>
                    <Badge variant={paymentResult.creditStatus === 'PAID_OFF' ? 'completed' : 'success'}>
                      {paymentResult.creditStatus === 'PAID_OFF' ? '¡Liquidado!' : 'Activo'}
                    </Badge>
                  </div>
                  {paymentResult.distributions.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-xs font-medium text-muted-foreground">Distribución:</p>
                      {paymentResult.distributions.map((d) => (
                        <div key={d.installmentNo} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Cuota {d.installmentNo}
                          </span>
                          <span className="text-foreground">
                            {formatCurrency(d.appliedToInstallment + d.appliedToPenalty)}
                            {d.appliedToPenalty > 0 && (
                              <span className="text-muted-foreground ml-1">
                                (mora: {formatCurrency(d.appliedToPenalty)})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/creditos/${creditoId}`)}
                  >
                    Ver crédito
                  </Button>
                  <Button
                    className="flex-1 bg-accent-500 text-accent-900 hover:bg-accent-400"
                    onClick={() => router.push('/dashboard/creditos')}
                  >
                    Mis créditos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP: Error */}
          {paymentStep === 'error' && (
            <Card className="border-error-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-error-900">
                  <XCircle className="w-4 h-4 text-error-600" />
                  No se pudo procesar el pago
                </CardTitle>
                <CardDescription className="text-error-700">
                  {paymentError ?? 'Ocurrió un error inesperado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPaymentStep('select-method');
                      setPaymentError(null);
                    }}
                  >
                    Intentar de nuevo
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/creditos/${creditoId}`)}
                  >
                    Volver al crédito
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already paid state */}
          {isPaid && paymentStep !== 'success' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  Todo en orden
                </CardTitle>
                <CardDescription>
                  Esta cuota fue pagada correctamente. No hay acciones pendientes.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Future installment — still shows payment */}
          {cuota.status === 'PENDING' && paymentStep !== 'success' && paymentStep !== 'error' && paymentStep !== 'processing' && !needsPayment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Sin saldo pendiente
                </CardTitle>
                <CardDescription>
                  Esta cuota no tiene saldo pendiente.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-success-600" />
            Pagos seguros y encriptados
          </div>
        </div>
      </div>
    </div>
  );
}
