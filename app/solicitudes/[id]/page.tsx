'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { useCreditScoreStore } from '@/lib/stores/credit-score-store';
import { SolicitudResumenView } from '@/components/solicitudes/SolicitudResumenView';
import { Loader2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SolicitudPage() {
  const router = useRouter();
  const application = useSolicitudStore(s => s.application);
  const applicationStatus = useSolicitudStore(s => s.applicationStatus);
  const fullDetail = useSolicitudStore(s => s.fullDetail);
  const detailStatus = useSolicitudStore(s => s.detailStatus);
  const documents = useSolicitudStore(s => s.documents);
  const documentsStatus = useSolicitudStore(s => s.documentsStatus);

  // Refrescar datos al montar (vienen del backend tras procesar la solicitud)
  useEffect(() => {
    const { refreshFullDetail, refreshDocuments, refreshContract } = useSolicitudStore.getState();
    refreshFullDetail();
    refreshDocuments();
    refreshContract();
  }, []);

  // Redirigir a /processing si la solicitud está en evaluación
  useEffect(() => {
    if (application && (application.status === 'SUBMITTED' || application.status === 'PROCESSING')) {
      router.replace(`/solicitudes/${application.id}/processing`);
    }
  }, [application, router]);

  // Recargar credit score cada vez que el estado de la aplicación cambia
  useEffect(() => {
    if (application) {
      useCreditScoreStore.getState().refetch().catch(() => {});
    }
  }, [application?.status]);

  // Redirigir si la solicitud no existe (success pero null)
  useEffect(() => {
    if (applicationStatus === 'success' && !application) {
      router.replace('/dashboard');
    }
  }, [applicationStatus, application, router]);

  // Skeleton mientras carga la aplicación
  if (applicationStatus === 'idle' || applicationStatus === 'pending') {
    return <ResumenSkeleton />;
  }

  // Si no existe la solicitud, no mostrar nada (el redirect se encarga)
  if (!application) {
    return <ResumenSkeleton />;
  }

  // Si está SUBMITTED/PROCESSING, mostrar spinner mientras se redirige
  if (application.status === 'SUBMITTED' || application.status === 'PROCESSING') {
    return (
      <Card className="w-full max-w-2xl mx-auto p-8">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Clock className="w-4 h-4 text-dark" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Analizando tu solicitud
            </h1>
            <p className="text-muted-foreground max-w-md">
              Estamos evaluando tus datos. Esto puede tomar unos segundos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '600ms' }} />
          </div>
          <p className="text-xs text-muted-foreground">No cierres esta ventana</p>
        </div>
      </Card>
    );
  }

  return (
    <SolicitudResumenView
      application={application}
      fullDetail={fullDetail}
      documents={documents}
      detailStatus={detailStatus}
      documentsStatus={documentsStatus}
    />
  );
}

function ResumenSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-200/60 p-8 md:p-10 animate-pulse">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-neutral-300/50 shrink-0" />
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="h-3 bg-neutral-300/50 rounded w-24 mx-auto md:mx-0" />
            <div className="h-8 bg-neutral-300/50 rounded w-3/4 mx-auto md:mx-0" />
            <div className="h-4 bg-neutral-300/50 rounded w-1/2 mx-auto md:mx-0" />
          </div>
          <div className="w-36 h-24 rounded-xl bg-neutral-300/50 shrink-0" />
        </div>
      </div>

      {/* Detalle del préstamo skeleton */}
      <div className="rounded-xl border border-neutral-100 p-5 space-y-4 animate-pulse">
        <div className="h-5 bg-neutral-100 rounded w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-neutral-100 rounded w-16" />
              <div className="h-6 bg-neutral-200 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Pasos / Acciones skeleton */}
      <div className="rounded-xl border border-neutral-100 p-5 space-y-4 animate-pulse">
        <div className="h-5 bg-neutral-100 rounded w-48" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-neutral-50">
            <div className="w-10 h-10 rounded-full bg-neutral-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-100 rounded w-40" />
              <div className="h-3 bg-neutral-50 rounded w-56" />
            </div>
            <div className="h-6 w-20 bg-neutral-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Cronograma skeleton */}
      <div className="rounded-xl border border-neutral-100 p-5 space-y-3 animate-pulse">
        <div className="h-5 bg-neutral-100 rounded w-36" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="h-4 bg-neutral-50 rounded w-24" />
              <div className="h-4 bg-neutral-50 rounded w-20" />
              <div className="h-4 bg-neutral-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
