'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import type { MyComplaint } from '@/modules/complaints';
import { COMPLAINT_STATUS_LABELS } from '@/modules/complaints';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string): { label: string; className: string; icon: React.ReactNode } {
  switch (status) {
    case 'RESPONDIDO':
      return { label: 'Respondido', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> };
    case 'EN_REVISION':
      return { label: 'En revisión', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> };
    default:
      return { label: 'Registrado', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <FileText className="h-3 w-3" /> };
  }
}

function getCountdownDisplay(remaining: number, isOverdue: boolean): { text: string; className: string } {
  if (isOverdue || remaining < 0) {
    return { text: `Vencido (${Math.abs(remaining)}d háb.)`, className: 'text-red-700 bg-red-50 border-red-200' };
  }
  if (remaining <= 5) {
    return { text: `${remaining} días háb. restantes`, className: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { text: `${remaining} días háb. restantes`, className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
}

// ── Componente ───────────────────────────────────────────────────────────────

interface ComplaintsListProps {
  complaints: MyComplaint[];
}

export function ComplaintsList({ complaints }: ComplaintsListProps) {
  if (complaints.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tienes reclamos registrados</p>
        <p className="text-xs text-muted-foreground mt-1">
          Si tienes alguna disconformidad con el servicio, puedes registrar un reclamo usando el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {complaints.map((complaint) => {
        const statusBadge = getStatusBadge(complaint.status);
        const countdown = getCountdownDisplay(complaint.businessDaysRemaining, complaint.isOverdue);
        const isResolved = complaint.status === 'RESPONDIDO';

        return (
          <Card key={complaint.id} className={isResolved ? 'opacity-80' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      #{String(complaint.correlativeNumber).padStart(2, '0')}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {complaint.type === 'RECLAMO' ? 'Reclamo' : 'Queja'}
                    </Badge>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusBadge.className}`}>
                      {statusBadge.icon}
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Detalle */}
                  <p className="text-sm font-medium">{complaint.productServiceDetail}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{complaint.complaintDetail}</p>

                  {/* Respuesta si existe */}
                  {complaint.responseText && (
                    <div className="mt-2 rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Respuesta:</p>
                      <p className="text-xs text-emerald-800">{complaint.responseText}</p>
                      {complaint.respondedAt && (
                        <p className="text-[10px] text-emerald-600 mt-1">
                          Respondido el {new Date(complaint.respondedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fecha y countdown */}
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-muted-foreground">
                      Ingresado: {new Date(complaint.submittedDate + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </span>
                    {!isResolved && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-medium ${countdown.className}`}>
                        {complaint.isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
                        {countdown.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
