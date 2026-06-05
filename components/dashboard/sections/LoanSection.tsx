'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, AlertCircle, Calculator, DollarSign, Calendar, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntencionStore } from '@/lib/stores/intencion-store';

export function LoanSection() {
  const status = useIntencionStore(s => s.status);
  const intencion = useIntencionStore(s => s.intencion);
  const error = useIntencionStore(s => s.error);
  const fetchIntencion = useIntencionStore(s => s.fetch);

  useEffect(() => {
    fetchIntencion();
  }, [fetchIntencion]);

  // Skeleton
  if (status === 'idle' || status === 'pending') {
    return <LoanSectionSkeleton />;
  }

  // Error
  if (status === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-error-600" />
              Tu última solicitud
            </span>
          </CardTitle>
          <CardDescription>{error || 'No se pudo cargar la información.'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Sin intención
  if (!intencion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Tu última solicitud
            </span>
          </CardTitle>
          <CardDescription>Aún no has configurado un préstamo</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/calculadora"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            Simular préstamo
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Con intención
  const formattedAmount = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(intencion.amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Tu última solicitud
          </span>
        </CardTitle>
        <CardDescription>
          Solicitud en curso
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Datos del préstamo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-primary/5 p-3">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-base font-bold text-foreground">{formattedAmount}</span>
            <span className="text-[10px] text-muted-foreground">Monto</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-primary/5 p-3">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-base font-bold text-foreground">{intencion.termDays}d</span>
            <span className="text-[10px] text-muted-foreground">Plazo</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-primary/5 p-3">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-base font-bold text-foreground">{intencion.installmentCount}</span>
            <span className="text-[10px] text-muted-foreground">Cuotas</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/solicitar/start"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/calculadora"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-muted-foreground font-medium text-sm rounded-lg hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoanSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </span>
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-3.5 w-40" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

LoanSection.Skeleton = LoanSectionSkeleton;
