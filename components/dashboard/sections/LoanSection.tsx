'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, FileText, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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

  // Skeleton: idle o pending
  if (status === 'idle' || status === 'pending') {
    return <LoanSectionSkeleton />;
  }

  // Error
  if (status === 'error') {
    return (
      <Card>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-error-100">
            <AlertCircle className="w-4 h-4 text-error-600" />
          </div>
          <h2 className="font-semibold text-dark">Tu Préstamo</h2>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-muted-foreground">{error || 'Error al cargar información del préstamo.'}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          intencion ? 'bg-primary' : 'bg-border'
        )}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-dark">
          {intencion ? 'Tu Préstamo' : 'Solicitar Préstamo'}
        </h2>
      </div>
      <div className="px-5 py-5 flex flex-col gap-3">
        {intencion ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-fondea-text">Monto</span>
              <span className="font-semibold text-dark">
                {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(intencion.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-fondea-text">Plazo</span>
              <span className="font-semibold text-dark">{intencion.termDays} días</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-fondea-text">Cuotas</span>
              <span className="font-semibold text-dark">{intencion.installmentCount}</span>
            </div>
            <div className="border-t border-border my-1" />
            <Link
              href="/solicitar/start"
              className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Continuar solicitud
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/calculadora"
              className="w-full flex items-center justify-between text-sm text-primary font-medium border border-border rounded-lg px-4 py-2.5 hover:bg-primary-50 transition-colors"
            >
              <span>Nuevo préstamo</span>
              <Plus className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-fondea-text">
              Configura el monto y plazo de tu préstamo para comenzar.
            </p>
            <Link
              href="/dashboard/calculadora"
              className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Pedir préstamo
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}

function LoanSectionSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="px-5 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </Card>
  );
}

LoanSection.Skeleton = LoanSectionSkeleton;
