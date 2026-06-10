'use client';

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
  Download,
  Shield,
  Info,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageTitle } from '@/components/ui/page-title';

/**
 * Detalle de una Cuota — toda la información de un pago específico.
 * Muestra estado, desglose, métodos de pago, comprobante.
 *
 * TODO: Conectar con API real.
 */

type CuotaStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'UPCOMING';

interface CuotaDetail {
  id: string;
  number: number;
  totalInstallments: number;
  creditId: string;
  amount: number;
  principal: number;
  interest: number;
  lateFee: number;
  totalDue: number;
  dueDate: string;
  paidDate: string | null;
  status: CuotaStatus;
  method: string | null;
  transactionId: string | null;
  receiptUrl: string | null;
  daysLate: number;
}

// Mock — cuota pagada
const mockCuotaPaid: CuotaDetail = {
  id: 'inst-001',
  number: 1,
  totalInstallments: 4,
  creditId: 'cred-001',
  amount: 375,
  principal: 340,
  interest: 35,
  lateFee: 0,
  totalDue: 375,
  dueDate: '2026-05-25',
  paidDate: '2026-05-24',
  status: 'PAID',
  method: 'Visa Débito ****4532',
  transactionId: 'TXN-2026-05-24-ABC123',
  receiptUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  daysLate: 0,
};

// Mock — cuota pendiente
const mockCuotaPending: CuotaDetail = {
  id: 'inst-002',
  number: 2,
  totalInstallments: 4,
  creditId: 'cred-001',
  amount: 375,
  principal: 345,
  interest: 30,
  lateFee: 0,
  totalDue: 375,
  dueDate: '2026-06-25',
  paidDate: null,
  status: 'PENDING',
  method: null,
  transactionId: null,
  receiptUrl: null,
  daysLate: 0,
};

// Mock — cuota vencida
const mockCuotaOverdue: CuotaDetail = {
  id: 'inst-003',
  number: 3,
  totalInstallments: 4,
  creditId: 'cred-001',
  amount: 375,
  principal: 350,
  interest: 25,
  lateFee: 15,
  totalDue: 390,
  dueDate: '2026-07-25',
  paidDate: null,
  status: 'OVERDUE',
  method: null,
  transactionId: null,
  receiptUrl: null,
  daysLate: 3,
};

// Para la demo, seleccionamos según el param
const mockCuotas: Record<string, CuotaDetail> = {
  'inst-001': mockCuotaPaid,
  'inst-002': mockCuotaPending,
  'inst-003': mockCuotaOverdue,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function StatusHeader({ status, daysLate }: { status: CuotaStatus; daysLate: number }) {
  switch (status) {
    case 'PAID':
      return (
        <div className="flex items-center gap-3 rounded-lg bg-success-50 border border-success-200 p-4">
          <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-success-900">Cuota pagada</p>
            <p className="text-xs text-success-700">El pago fue procesado correctamente</p>
          </div>
        </div>
      );
    case 'PENDING':
      return (
        <div className="flex items-center gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
          <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warning-900">Pago pendiente</p>
            <p className="text-xs text-warning-700">Esta cuota aún no ha sido pagada</p>
          </div>
        </div>
      );
    case 'OVERDUE':
      return (
        <div className="flex items-center gap-3 rounded-lg bg-error-50 border border-error-200 p-4">
          <div className="w-10 h-10 rounded-full bg-error-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-error-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-error-900">Cuota vencida — {daysLate} días de atraso</p>
            <p className="text-xs text-error-700">Se aplicó penalidad por mora. Paga lo antes posible para evitar reporte a Sentinel.</p>
          </div>
        </div>
      );
    case 'UPCOMING':
      return (
        <div className="flex items-center gap-3 rounded-lg bg-neutral-50 border border-border p-4">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-neutral-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Cuota futura</p>
            <p className="text-xs text-muted-foreground">Esta cuota aún no vence</p>
          </div>
        </div>
      );
  }
}

export default function CuotaDetallePage() {
  const params = useParams();
  const cuotaId = params.cuotaId as string;
  const creditoId = params.creditoId as string;

  // Mock: buscar la cuota. Default a pendiente si no existe
  const cuota = mockCuotas[cuotaId] || mockCuotaPending;

  const isPaid = cuota.status === 'PAID';
  const needsPayment = cuota.status === 'PENDING' || cuota.status === 'OVERDUE';

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto">
      {/* Nav */}
      <Link
        href={`/dashboard/creditos/${creditoId}/cuotas`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Cronograma de cuotas
      </Link>

      {/* Título */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Cuota {cuota.number} de {cuota.totalInstallments}
          </h1>
          <p className="text-xs text-muted-foreground">
            Crédito #{creditoId.slice(-6)}
          </p>
        </div>
        <Badge
          variant={
            cuota.status === 'PAID' ? 'success' :
            cuota.status === 'OVERDUE' ? 'error' :
            cuota.status === 'PENDING' ? 'warning' : 'pending'
          }
        >
          {cuota.status === 'PAID' ? 'Pagada' :
           cuota.status === 'OVERDUE' ? 'Vencida' :
           cuota.status === 'PENDING' ? 'Pendiente' : 'Futura'}
        </Badge>
      </div>

      {/* Estado principal */}
      <StatusHeader status={cuota.status} daysLate={cuota.daysLate} />

      {/* Desglose del monto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Desglose del pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Capital</span>
            <span className="text-sm font-medium text-foreground">{formatCurrency(cuota.principal)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Interés</span>
            <span className="text-sm font-medium text-foreground">{formatCurrency(cuota.interest)}</span>
          </div>
          {cuota.lateFee > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-error-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Penalidad por mora
              </span>
              <span className="text-sm font-medium text-error-600">{formatCurrency(cuota.lateFee)}</span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-semibold text-foreground">Total a pagar</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(cuota.totalDue)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Fechas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Fechas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Fecha de vencimiento</span>
            <span className="text-sm font-medium text-foreground">{formatDate(cuota.dueDate)}</span>
          </div>
          {cuota.paidDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fecha de pago</span>
              <span className="text-sm font-medium text-success-700">{formatDate(cuota.paidDate)}</span>
            </div>
          )}
          {cuota.daysLate > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-error-600">Días de atraso</span>
              <span className="text-sm font-bold text-error-600">{cuota.daysLate} días</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Si está pagada: Info de la transacción */}
      {isPaid && (
        <Card className="border-success-200 bg-success-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-700" />
              Datos del pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cuota.method && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Método de pago</span>
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {cuota.method}
                </span>
              </div>
            )}
            {cuota.transactionId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID de transacción</span>
                <code className="text-xs font-mono text-muted-foreground bg-neutral-100 px-2 py-0.5 rounded">
                  {cuota.transactionId}
                </code>
              </div>
            )}
            {cuota.receiptUrl && (
              <>
                <Separator />
                <a href={cuota.receiptUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Descargar comprobante de pago
                  </Button>
                </a>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Si necesita pago: Métodos de pago */}
      {needsPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Métodos de pago disponibles
            </CardTitle>
            <CardDescription>Elige cómo pagar esta cuota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Tarjeta */}
            <button className="w-full flex items-center gap-4 rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Tarjeta de débito o crédito</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, American Express</p>
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0">Recomendado</Badge>
            </button>

            {/* Yape/Plin */}
            <button className="w-full flex items-center gap-4 rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
              <div className="w-11 h-11 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Yape / Plin</p>
                <p className="text-xs text-muted-foreground">Paga con tu billetera digital</p>
              </div>
            </button>

            {/* Transferencia */}
            <button className="w-full flex items-center gap-4 rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
              <div className="w-11 h-11 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-accent-800" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Transferencia bancaria</p>
                <p className="text-xs text-muted-foreground">BCP, Interbank, BBVA, Scotiabank</p>
              </div>
            </button>

            <Separator />

            {/* Botón principal de pago */}
            <Button className="w-full gap-2 h-11 bg-accent-500 text-accent-900 hover:bg-accent-400 font-semibold">
              <DollarSign className="w-4 h-4" />
              Pagar {formatCurrency(cuota.totalDue)}
            </Button>

            {/* Placeholder pasarela */}
            <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Aquí se integrará la pasarela de pagos (Culqi, MercadoPago o similar)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Si está vencida: advertencia */}
      {cuota.status === 'OVERDUE' && (
        <Card className="border-error-200 bg-error-50/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-error-900">Consecuencias del atraso</p>
                <ul className="text-xs text-error-700 space-y-1">
                  <li>• Se aplicó penalidad de {formatCurrency(cuota.lateFee)} por {cuota.daysLate} días de mora</li>
                  <li>• A los 5 días se reporta a Sentinel (afecta tu score crediticio)</li>
                  <li>• A los 15 días se bloquea tu línea de crédito</li>
                </ul>
                <p className="text-xs text-error-600 font-medium pt-1">
                  Paga hoy para evitar más consecuencias.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seguridad */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-success-600" />
          Pago seguro SSL
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-muted-foreground" />
          <Link href="/dashboard/educacion/costo-mora" className="hover:text-primary hover:underline">
            ¿Qué pasa si no pago?
          </Link>
        </div>
      </div>
    </div>
  );
}
