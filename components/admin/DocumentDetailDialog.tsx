'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, FileImage } from 'lucide-react';

export interface DocumentDetail {
  name: string;
  status: 'verified' | 'pending' | 'failed' | 'not_uploaded';
  type: string;
  uploadedAt: string | null;
  fileSize: string | null;
}

const STATUS_CONFIG: Record<DocumentDetail['status'], { label: string; variant: string }> = {
  verified: { label: 'Verificado', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
  failed: { label: 'Rechazado', variant: 'error' },
  not_uploaded: { label: 'No subido', variant: 'secondary' },
};

export function DocumentDetailDialog({ doc }: { doc: DocumentDetail }) {
  const statusCfg = STATUS_CONFIG[doc.status];

  return (
    <Dialog>
      <DialogTrigger className="rounded p-1 hover:bg-muted transition-colors" aria-label={`Ver detalle de ${doc.name}`}>
        <Eye className="h-4 w-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{doc.name}</DialogTitle>
          <DialogDescription>Detalle del documento</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preview placeholder */}
          <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center">
            <FileImage className="h-12 w-12 text-muted-foreground/40" />
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant={statusCfg.variant as any}>{statusCfg.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <span className="text-sm font-medium">{doc.type}</span>
            </div>
            {doc.uploadedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fecha de carga</span>
                <span className="text-sm font-medium">
                  {new Date(doc.uploadedAt).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            {doc.fileSize && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tamaño</span>
                <span className="text-sm font-medium">{doc.fileSize}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
