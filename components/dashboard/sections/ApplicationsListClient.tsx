'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { deleteApplication } from '@/app/actions/applications-list.actions';
import type { ApplicationRecord } from '@/lib/types';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusVariant(status: string): 'completed' | 'pending' | 'error' | 'warning' {
  const s = status.toUpperCase();
  if (s === 'APPROVED') return 'completed';
  if (s === 'REJECTED' || s === 'REJECTED_BY_USER' || s === 'FAILED' || s === 'BLOCKED') return 'error';
  if (s === 'MORE_INFO') return 'warning';
  return 'pending';
}

/**
 * TEMPORAL — lista de solicitudes con botón eliminar.
 */
export function ApplicationsListClient({ applications: initial }: { applications: ApplicationRecord[] }) {
  const [list, setList] = useState(initial);

  const handleDelete = async (id: string) => {
    if (!window.confirm('[DEV] ¿Eliminar esta solicitud? (funcionalidad temporal para desarrollo)')) return;
    const toastId = toast.loading('Eliminando...');
    const result = await deleteApplication(id);
    if (result.ok) {
      toast.success('Eliminada', { id: toastId });
      setList((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast.error('Error al eliminar', { id: toastId });
    }
  };

  return (
    <>
      {list.map((app) => (
        <div
          key={app.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Link href={`/solicitudes/${app.id}`} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </Link>
          <Link href={`/solicitudes/${app.id}`} className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-foreground">
              Solicitud #{app.id.slice(0, 8)}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {app.submittedAt ? formatDate(app.submittedAt) : '—'}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={getStatusVariant(app.status)} className="text-[9px]">
              {app.status}
            </Badge>
            <button
              onClick={() => handleDelete(app.id)}
              className="p-1 rounded-md hover:bg-error-50 text-muted-foreground hover:text-error-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
