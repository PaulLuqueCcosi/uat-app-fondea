'use client';

import { useEffect } from 'react';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { SolicitudResumenView } from '@/components/solicitudes/SolicitudResumenView';
import { ApprovedCelebration } from '@/components/solicitudes/ApprovedCelebration';
import { Loader2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SolicitudPage() {
  const application = useSolicitudStore(s => s.application);
  const fullDetail = useSolicitudStore(s => s.fullDetail);
  const documents = useSolicitudStore(s => s.documents);
  const isPolling = useSolicitudStore(s => s.isPolling);
  const showCelebration = useSolicitudStore(s => s.showCelebration);
  const fetchApplication = useSolicitudStore(s => s.fetchApplication);
  const fetchFullDetail = useSolicitudStore(s => s.fetchFullDetail);
  const fetchDocuments = useSolicitudStore(s => s.fetchDocuments);
  const startPolling = useSolicitudStore(s => s.startPolling);

  useEffect(() => {
    fetchApplication();
    fetchFullDetail();
    fetchDocuments();
  }, [fetchApplication, fetchFullDetail, fetchDocuments]);

  // Iniciar polling cuando la application llega con status de evaluación
  useEffect(() => {
    if (application && (application.status === 'SUBMITTED' || application.status === 'PROCESSING')) {
      startPolling();
    }
  }, [application, startPolling]);

  // Celebración
  if (showCelebration) {
    return <ApprovedCelebration />;
  }

  // Skeleton
  if (!application) {
    return <ResumenSkeleton />;
  }

  // Polling
  if (isPolling || application.status === 'SUBMITTED' || application.status === 'PROCESSING') {
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
    />
  );
}

function ResumenSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="rounded-2xl bg-neutral-100 p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-neutral-200" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-neutral-200 rounded w-1/4" />
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-200 rounded w-1/2" />
          </div>
          <div className="w-32 h-20 rounded-xl bg-neutral-200" />
        </div>
      </div>
      <div className="rounded-xl border border-neutral-100 p-5 space-y-4">
        <div className="h-4 bg-neutral-100 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
              <div className="h-6 bg-neutral-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-neutral-100 p-5 space-y-3">
        <div className="h-4 bg-neutral-100 rounded w-1/3" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-4 border border-neutral-50 rounded-lg">
            <div className="w-9 h-9 rounded-xl bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-100 rounded w-1/2" />
              <div className="h-3 bg-neutral-50 rounded w-2/3" />
            </div>
            <div className="h-5 w-16 bg-neutral-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
