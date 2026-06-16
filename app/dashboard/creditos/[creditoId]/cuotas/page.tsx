'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { getInstallmentsByCreditIdAction } from '@/app/actions/credit.actions';
import type { InstallmentDetail } from '@/modules/credits';
import { installmentStatusLabels } from '@/modules/credits';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: InstallmentDetail['status'] }) {
  switch (status) {
    case 'PAID':
      return <CheckCircle className="w-5 h-5 text-success-700" />;
    case 'PENDING':
      return <Clock className="w-5 h-5 text-warning-700" />;
    case 'OVERDUE':
      return <AlertCircle className="w-5 h-5 text-error-500" />;
    default:
      return <Clock className="w-5 h-5 text-neutral-400" />;
  }
}

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'pending'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'error',
  UPCOMING: 'pending',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CuotasSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      <div className="h-5 w-32 bg-neutral-200 rounded" />
      <div className="h-8 w-64 bg-neutral-200 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-neutral-100 rounded-lg" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-neutral-100 rounded-lg" />
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CuotasPage() {
  const params = useParams();
  const creditoId = params.creditoId as string;

  const [installments, setInstallments] = useState<InstallmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInstallments() {
      setLoading(true);
      const result = await getInstallmentsByCreditIdAction(creditoId);
      if (result.ok) {
        setInstallments(result.data);
      } else {
        setError(result.error.message);
      }
      setLoading(false);
    }
    fetchInstallments();
  }, [creditoId]);

  if (loading) return <CuotasSkeleton />;

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <CreditCard className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href={`/dashboard/creditos/${creditoId}`}>
          <Button variant="outline" size="sm">Volver al crédito</Button>
        </Link>
      </div>
    );
  }

  const paidCount = installments.filter((i) => i.status === 'PAID').length;
  const totalPaid = installments.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const totalInterest = installments.reduce((s, i) => s + i.interest, 0);
  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);
  const pendingBalance = installments.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Nav */}
      <Link
        href={`/dashboard/creditos/${creditoId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Detalle del crédito
      </Link>

      <PageTitle
        title="Cronograma de Cuotas"
        description={`Crédito de ${formatCurrency(totalAmount)} · ${paidCount} de ${installments.length} cuotas pagadas`}
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Capital total</p>
            <p className="text-base font-bold text-foreground">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Intereses total</p>
            <p className="text-base font-bold text-foreground">{formatCurrency(totalInterest)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Pagado</p>
            <p className="text-base font-bold text-success-700">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Por pagar</p>
            <p className="text-base font-bold text-primary">{formatCurrency(pendingBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de cuotas detallada */}
      <div className="space-y-3">
        {installments.map((inst) => {
          const daysUntil = Math.ceil(
            (new Date(inst.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Card
              key={inst.id}
              className={
                inst.status === 'PAID'
                  ? 'border-success-200 bg-success-50/30'
                  : inst.status === 'PENDING'
                    ? 'border-warning-200 bg-warning-50/30'
                    : inst.status === 'OVERDUE'
                      ? 'border-error-200 bg-error-50/30'
                      : ''
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {/* Icono estado */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    inst.status === 'PAID'
                      ? 'bg-success-100'
                      : inst.status === 'PENDING'
                        ? 'bg-warning-100'
                        : inst.status === 'OVERDUE'
                          ? 'bg-error-100'
                          : 'bg-neutral-100'
                  }`}>
                    <StatusIcon status={inst.status} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        Cuota {inst.number} de {inst.totalInstallments}
                      </p>
                      <Badge variant={statusBadgeVariant[inst.status] ?? 'pending'}>
                        {installmentStatusLabels[inst.status]}
                      </Badge>
                      {inst.status === 'PENDING' && daysUntil > 0 && (
                        <Badge variant="outline" className="text-[9px]">
                          En {daysUntil} días
                        </Badge>
                      )}
                    </div>

                    {/* Desglose */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Total cuota</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(inst.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Capital</p>
                        <p className="text-sm font-medium text-foreground">{formatCurrency(inst.principal)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Interés</p>
                        <p className="text-sm font-medium text-foreground">{formatCurrency(inst.interest)}</p>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Vence: {formatDate(inst.dueDate)}
                      </span>
                      {inst.paidDate && (
                        <span className="flex items-center gap-1 text-success-700">
                          <CheckCircle className="w-3 h-3" />
                          Pagada: {formatDateShort(inst.paidDate)}
                        </span>
                      )}
                    </div>

                    {/* Método de pago */}
                    {inst.method && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {inst.method}
                      </p>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center gap-2 pt-1">
                      {inst.status === 'PAID' && inst.receiptUrl && (
                        <a href={inst.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="xs" className="gap-1">
                            <Download className="w-3 h-3" />
                            Descargar comprobante
                          </Button>
                        </a>
                      )}
                      {(inst.status === 'PENDING' || inst.status === 'OVERDUE') && (
                        <Link href={`/dashboard/creditos/${creditoId}/cuotas/${inst.id}`}>
                          <Button size="xs" className="gap-1 bg-accent-500 text-accent-900 hover:bg-accent-400">
                            <DollarSign className="w-3 h-3" />
                            Pagar esta cuota
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/creditos/${creditoId}/cuotas/${inst.id}`}>
                        <Button variant="outline" size="xs" className="gap-1">
                          Ver detalle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Nota de seguridad */}
      <div className="flex items-center justify-center gap-3 py-2 text-xs text-muted-foreground">
        <Shield className="w-4 h-4 text-success-600" />
        Todos los pagos son procesados de forma segura y encriptada.
      </div>
    </div>
  );
}
