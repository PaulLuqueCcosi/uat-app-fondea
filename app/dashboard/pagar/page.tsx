'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  DollarSign,
  Calendar,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageTitle } from '@/components/ui/page-title';

/**
 * Página de Pago de Cuota.
 * Muestra la cuota pendiente y las opciones de pago.
 *
 * TODO: Integrar pasarela de pagos real (Culqi, MercadoPago, etc.)
 * Por ahora es solo maqueta visual.
 */

// Mock
const mockNextPayment = {
  installmentNumber: 2,
  totalInstallments: 4,
  amount: 375,
  dueDate: '2026-06-25',
  loanId: 'loan-001',
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
    month: 'long',
    year: 'numeric',
  });
}

export default function PagarPage() {
  const payment = mockNextPayment;
  const daysUntil = Math.ceil(
    (new Date(payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto">
      {/* Navegación */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al dashboard
      </Link>

      <PageTitle
        title="Pagar Cuota"
        description="Realiza el pago de tu cuota pendiente de forma rápida y segura."
      />

      {/* Resumen de la cuota */}
      <Card className="ring-2 ring-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-primary" />
            Cuota a pagar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cuota {payment.installmentNumber} de {payment.totalInstallments}</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {formatCurrency(payment.amount)}
              </p>
            </div>
            <Badge
              variant={daysUntil <= 3 ? 'warning' : 'outline'}
              className="text-xs"
            >
              {daysUntil <= 0 ? 'Vencida' : `Vence en ${daysUntil} días`}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            Fecha de vencimiento: {formatDate(payment.dueDate)}
          </div>
        </CardContent>
      </Card>

      {/* Métodos de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-5 h-5 text-primary" />
            Elige cómo pagar
          </CardTitle>
          <CardDescription>Todas las transacciones son seguras y encriptadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Opción: Tarjeta */}
          <button className="w-full flex items-center gap-4 rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Tarjeta de débito o crédito</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard, American Express</p>
            </div>
            <Badge variant="outline" className="text-[9px] shrink-0">Recomendado</Badge>
          </button>

          {/* Opción: Yape */}
          <button className="w-full flex items-center gap-4 rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Yape / Plin</p>
              <p className="text-xs text-muted-foreground">Paga con tu billetera digital</p>
            </div>
          </button>

          {/* Opción: Transferencia */}
          <button className="w-full flex items-center gap-4 rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
            <div className="w-12 h-12 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-accent-800" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Transferencia bancaria</p>
              <p className="text-xs text-muted-foreground">BCP, Interbank, BBVA, Scotiabank</p>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Placeholder: Aquí iría el formulario de pago */}
      <Card className="border-dashed border-2 border-neutral-300 bg-neutral-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Formulario de pago
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Aquí se integrará la pasarela de pagos (Culqi, MercadoPago o similar).
              El usuario podrá ingresar su tarjeta o confirmar con Yape/Plin sin salir de la plataforma.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-success-600" />
          Pago seguro SSL
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-success-600" />
          Datos encriptados
        </div>
      </div>
    </div>
  );
}
