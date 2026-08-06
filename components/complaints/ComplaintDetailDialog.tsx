'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import type { MyComplaint } from '@/modules/complaints';

function getStatusBadge(status: string): { label: string; variant: 'success' | 'warning' | 'secondary'; icon: React.ReactNode } {
  switch (status) {
    case 'RESPONDIDO':
      return { label: 'Respondido', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> };
    case 'EN_REVISION':
      return { label: 'En revisión', variant: 'warning', icon: <Clock className="h-3 w-3" /> };
    default:
      return { label: 'Registrado', variant: 'secondary', icon: <FileText className="h-3 w-3" /> };
  }
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface ComplaintDetailDialogProps {
  complaint: MyComplaint | null;
  onOpenChange: (open: boolean) => void;
}

export function ComplaintDetailDialog({ complaint, onOpenChange }: ComplaintDetailDialogProps) {
  if (!complaint) return null;

  const statusBadge = getStatusBadge(complaint.status);
  const isResolved = complaint.status === 'RESPONDIDO';

  return (
    <Dialog open={!!complaint} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            Reclamo #{String(complaint.correlativeNumber).padStart(2, '0')}
            <Badge variant="outline" className="text-[10px]">
              {complaint.type === 'RECLAMO' ? 'Reclamo' : 'Queja'}
            </Badge>
            <Badge variant={statusBadge.variant} className="text-[10px] gap-1">
              {statusBadge.icon}
              {statusBadge.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Ingresado el {formatDate(complaint.submittedDate)} · Plazo de respuesta: {formatDate(complaint.legalDeadline)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Producto o servicio</p>
            <p className="text-sm font-medium">{complaint.productServiceDetail}</p>
            {complaint.amountInvolved != null && (
              <p className="text-xs text-muted-foreground mt-0.5">Monto involucrado: {formatMoney(complaint.amountInvolved)}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Tu reclamo</p>
            <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/40 p-3">{complaint.complaintDetail}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Lo que solicitaste</p>
            <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/40 p-3">{complaint.consumerRequest}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Respuesta</p>
            {isResolved ? (
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="text-sm whitespace-pre-wrap">{complaint.responseText}</p>
                {complaint.respondedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    Respondido el {new Date(complaint.respondedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {complaint.isOverdue ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    Todavía no se ha respondido — el plazo legal venció hace {Math.abs(complaint.businessDaysRemaining)} días hábiles.
                  </>
                ) : (
                  <>Todavía no se ha respondido — quedan {complaint.businessDaysRemaining} días hábiles del plazo legal.</>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
