'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getInstallmentByNoAction, getCreditByIdAction } from '@/app/actions/credit.actions';
import type { Installment, InstallmentStatus, Credit } from '@/modules/credits';
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
  CURRENT: 'warning',
  PARTIALLY_PAID: 'warning',
  PENDING: 'pending',
  OVERDUE: 'error',
};

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
  const cuotaNo = Number(params.cuotaNo);
  const creditoId = params.creditoId as string;

  const [cuota, setCuota] = useState<Installment | null>(null);
  const [credit, setCredit] = useState<Credit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const needsPayment = cuota.status === 'CURRENT' || cuota.status === 'OVERDUE' || cuota.status === 'PARTIALLY_PAID';
  const totalInstallments = credit?.installmentCount ?? 0;

  // Total que debe pagar el usuario para esta cuota
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
      {isPaid && (
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
      {cuota.status === 'CURRENT' && (
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
      {cuota.status === 'PARTIALLY_PAID' && (
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
      {isOverdue && (
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
      {cuota.status === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Cuota futura
            </CardTitle>
            <CardDescription>
              Vence el {formatDate(cuota.dueDate)} — aún no habilitada para pago
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
              <Separator />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vencimiento</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(cuota.dueDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {isPaid ? 'Fecha de pago' : 'Estado'}
                  </p>
                  <p className={`text-sm font-medium mt-0.5 ${isPaid ? 'text-accent-700' : isOverdue ? 'text-error-600' : 'text-foreground'}`}>
                    {isPaid && cuota.paidAt ? formatDate(cuota.paidAt) : isOverdue ? `${cuota.daysOverdue} días de atraso` : 'Sin pagar'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advertencia si vencida */}
          {isOverdue && (
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

        {/* ── Columna derecha: Pago o estado ── */}
        <div className="flex flex-col gap-6">
          {needsPayment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Pagar esta cuota
                </CardTitle>
                <CardDescription>Elige cómo pagar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Tarjeta de débito o crédito</p>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">Recomendado</Badge>
                </button>

                <button className="w-full flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Yape / Plin</p>
                    <p className="text-xs text-muted-foreground">Billetera digital</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-accent-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Transferencia bancaria</p>
                    <p className="text-xs text-muted-foreground">BCP, Interbank, BBVA, Scotiabank</p>
                  </div>
                </button>

                <Separator />

                <Button
                  className={`w-full gap-2 h-11 font-semibold ${
                    isOverdue
                      ? 'bg-error-600 text-white hover:bg-error-700'
                      : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Pagar {formatCurrency(totalToPay)}
                </Button>

                <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Aquí se integrará la pasarela de pagos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isPaid && (
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

          {cuota.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Cuota no disponible
                </CardTitle>
                <CardDescription>
                  Podrás pagar cuando se acerque la fecha de vencimiento.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Seguridad */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-success-600" />
            Pagos seguros y encriptados
          </div>
        </div>
      </div>
    </div>
  );
}
