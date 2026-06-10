'use client';

import Link from 'next/link';
import {
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageTitle } from '@/components/ui/page-title';

/**
 * Historial de Pagos — Lista de pagos realizados con estado y comprobante.
 *
 * TODO: Conectar con API real de pagos.
 */

interface Payment {
  id: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'CONFIRMED' | 'PENDING' | 'OVERDUE';
  method: string | null;
  receiptUrl: string | null;
}

// Mock data
const mockPayments: Payment[] = [
  {
    id: 'pay-001',
    installmentNumber: 1,
    totalInstallments: 4,
    amount: 375,
    dueDate: '2026-05-25',
    paidDate: '2026-05-24',
    status: 'CONFIRMED',
    method: 'Tarjeta Visa ****4532',
    receiptUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'pay-002',
    installmentNumber: 2,
    totalInstallments: 4,
    amount: 375,
    dueDate: '2026-06-25',
    paidDate: null,
    status: 'PENDING',
    method: null,
    receiptUrl: null,
  },
  {
    id: 'pay-003',
    installmentNumber: 3,
    totalInstallments: 4,
    amount: 375,
    dueDate: '2026-07-25',
    paidDate: null,
    status: 'PENDING',
    method: null,
    receiptUrl: null,
  },
  {
    id: 'pay-004',
    installmentNumber: 4,
    totalInstallments: 4,
    amount: 375,
    dueDate: '2026-08-25',
    paidDate: null,
    status: 'PENDING',
    method: null,
    receiptUrl: null,
  },
];

const mockLoanSummary = {
  totalAmount: 1500,
  paidAmount: 375,
  pendingAmount: 1125,
  nextDueDate: '2026-06-25',
  nextAmount: 375,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: Payment['status'] }) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="w-3 h-3" />
          Confirmado
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="pending" className="gap-1">
          <Clock className="w-3 h-3" />
          Pendiente
        </Badge>
      );
    case 'OVERDUE':
      return (
        <Badge variant="error" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Vencido
        </Badge>
      );
  }
}

export default function PagosPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PageTitle
        title="Historial de Pagos"
        description="Revisa todos tus pagos realizados y descarga comprobantes."
      />

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Total préstamo</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(mockLoanSummary.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Pagado</p>
            <p className="text-lg font-bold text-success-700">{formatCurrency(mockLoanSummary.paidAmount)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Pendiente</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(mockLoanSummary.pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Próximo vencimiento</p>
            <p className="text-sm font-bold text-foreground">{formatDate(mockLoanSummary.nextDueDate)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Cronograma de cuotas
            </span>
          </CardTitle>
          <CardDescription>
            {mockPayments.filter((p) => p.status === 'CONFIRMED').length} de {mockPayments.length} cuotas pagadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPayments.map((payment) => (
              <div
                key={payment.id}
                className={`flex items-center gap-4 rounded-lg border p-4 ${
                  payment.status === 'CONFIRMED'
                    ? 'bg-success-50/50 border-success-200'
                    : 'bg-white border-border'
                }`}
              >
                {/* Número de cuota */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {payment.installmentNumber}/{payment.totalInstallments}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      Cuota {payment.installmentNumber}
                    </p>
                    <StatusBadge status={payment.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Vence: {formatDate(payment.dueDate)}
                    </span>
                    {payment.paidDate && (
                      <span className="flex items-center gap-1 text-success-700">
                        <CheckCircle className="w-3 h-3" />
                        Pagado: {formatDate(payment.paidDate)}
                      </span>
                    )}
                  </div>
                  {payment.method && (
                    <p className="text-[10px] text-muted-foreground mt-1">{payment.method}</p>
                  )}
                </div>

                {/* Monto + Acciones */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-base font-bold text-foreground">
                    {formatCurrency(payment.amount)}
                  </p>
                  {payment.status === 'CONFIRMED' && payment.receiptUrl && (
                    <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="xs" className="gap-1">
                        <Download className="w-3 h-3" />
                        Comprobante
                      </Button>
                    </a>
                  )}
                  {payment.status === 'PENDING' && (
                    <Link href="/dashboard/pagar">
                      <Button size="xs" className="gap-1 bg-accent-500 text-accent-900 hover:bg-accent-400">
                        <DollarSign className="w-3 h-3" />
                        Pagar
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
