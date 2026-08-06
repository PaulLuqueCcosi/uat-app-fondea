import { Suspense } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { getMyComplaintsAction } from '@/app/actions/complaint.actions';
import { ComplaintsPageClient } from '@/components/complaints/ComplaintsPageClient';

async function ComplaintsLoader() {
  const result = await getMyComplaintsAction();

  if (!result.ok) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-destructive">{result.error.message}</p>
        <p className="text-xs text-muted-foreground mt-1">Intenta recargar la página.</p>
      </div>
    );
  }

  return <ComplaintsPageClient complaints={result.data} />;
}

export default function MisReclamosPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquareWarning className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Libro de Reclamaciones</h1>
          <p className="text-sm text-muted-foreground">
            Registra un reclamo o queja — plazo de respuesta: 15 días hábiles
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-40 bg-muted animate-pulse rounded-lg" />}>
        <ComplaintsLoader />
      </Suspense>
    </div>
  );
}
