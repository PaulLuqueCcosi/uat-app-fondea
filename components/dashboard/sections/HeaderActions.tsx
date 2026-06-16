import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderActionsProps {
  hasActiveIntencion: boolean;
}

export function HeaderActions({ hasActiveIntencion }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {hasActiveIntencion && (
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
          hasActiveIntencion
            ? 'border border-primary/30 text-primary hover:bg-primary/5'
            : 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl',
        )}
      >
        <Plus className="w-4 h-4" />
        {hasActiveIntencion ? 'Nuevo préstamo' : 'Pedir préstamo'}
      </Link>
    </div>
  );
}
