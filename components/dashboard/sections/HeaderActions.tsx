'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { Skeleton } from '@/components/ui/skeleton';

export function HeaderActions() {
  const status = useIntencionStore(s => s.status);
  const intencion = useIntencionStore(s => s.intencion);
  const fetchIntencion = useIntencionStore(s => s.fetch);

  useEffect(() => {
    fetchIntencion();
  }, [fetchIntencion]);

  if (status === 'idle' || status === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {intencion && (
        <Link
          href="/solicitar/start"
          className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          Continuar solicitud
        </Link>
      )}
      <Link
        href="/dashboard/calculadora"
        className={cn(
          'flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap text-sm',
          intencion
            ? 'border border-primary/30 text-primary hover:bg-primary/5'
            : 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl',
        )}
      >
        <Plus className="w-4 h-4" />
        {intencion ? 'Nuevo préstamo' : 'Pedir préstamo'}
      </Link>
    </div>
  );
}
