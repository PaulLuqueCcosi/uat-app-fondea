'use client';

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
  FileText,
  Shield,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageTitle } from '@/components/ui/page-title';

/**
 * Detalle de Cuotas de un Crédito.
 * Cronograma completo con acciones: pagar, descargar comprobante.
 *
 * TODO: Conectar con API real.
 */

interface Installment {
  id: string;
  number: number;
  amount: number;
  principal: number;
  interest: number;
  dueDate: string;
  paidDate: string | null;
  status: 'PAID' | 'PENDING' | 'UPCOMING' | 'OVERDUE';
  method: string | null;
  receiptUrl: string | null;
}

const mockInstallments: Installment[] = [
  {
    id: 'inst-001',
    number: 1,
    amount: 375,
    principal: 340,
    interest: 35,
    dueDate: '2026-05-25',
    paidDate: '2026-05-24',
    status: 'PAID',
    method: 'Visa ****4532',
    receiptUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'inst-002',
    number: 2,
    amount: 375,
    principal: 345,
    interest: 30,
    dueDate: '2026-06-25',
    paidDate: null,
    status: 'PENDING',
    method: null,
    receiptUrl: null,
  },
  {
    id: 'inst-003',
    number: 3,
    amount: 375,
    principal: 350,
    interest: 25,
    dueDate: '2026-07-25',
    paidDate: null,
    status: 'UPCOMING',
    method: null,
    receiptUrl: null,
  },
  {
    id: 'inst-004',
    number: 4,
    amount: 375,
    principal: 355,
    interest: 20,
    dueDate: '2026-08-25',
    paidDate: null,
    status: 'UPCOMING',
    method: null,
    receiptUrl: null,
  },
];

const mockCreditSummary = {
  id: 'cred-001',
  totalAmount: 1500,
  totalInterest: 110,
  totalPaid: 375,
  pendingBalance: 1125,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function StatusIcon({ status }: { status: Installment['status'] }) {
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

function StatusBadge({ status }: { status: Installment['status'] }) {
  switch (status) {
    case 'PAID':
      return <Badge variant="success">Pagada</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pendiente</Badge>;
    case 'OVERDUE':
      return <Badge variant="error">Vencida</Badge>;
    default:
      return <Badge variant="pending">Próxima</Badge>;
  }
}

export default function CuotasPage() {
  const params = useParams();
  const credit = mockCreditSummary;
  const installments = mockInstallments;
  const paidCount = installments.filter((i) => i.status === 'PAID').length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Nav */}
      <Link
        href={`/dashboard/creditos/${credit.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Detalle del crédito
      </Link>

      <PageTitle
        title="Cronograma de Cuotas"
        description={`Crédito de ${formatCurrency(credit.totalAmount)} · ${paidCount} de ${installments.length} cuotas pagadas`}
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Capital total</p>
            <p className="text-base font-bold text-foreground">{formatCurrency(credit.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Intereses total</p>
            <p className="text-base font-bold text-foreground">{formatCurrency(credit.totalInterest)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Pagado</p>
            <p className="text-base font-bold text-success-700">{formatCurrency(credit.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Por pagar</p>
            <p className="text-base font-bold text-primary">{formatCurrency(credit.pendingBalance)}</p>
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
                        Cuota {inst.number} de {installments.length}
                      </p>
                      <StatusBadge status={inst.status} />
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
                        <Link href={`/dashboard/creditos/${credit.id}/cuotas/${inst.id}`}>
                          <Button size="xs" className="gap-1 bg-accent-500 text-accent-900 hover:bg-accent-400">
                            <DollarSign className="w-3 h-3" />
                            Pagar esta cuota
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/creditos/${credit.id}/cuotas/${inst.id}`}>
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
