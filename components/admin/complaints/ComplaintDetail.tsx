'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DataRow } from '@/components/ui/data-row';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { Clock, User, FileText, MessageSquare, AlertTriangle, Loader2, Send, Eye } from 'lucide-react';
import type { AdminComplaintDetail } from '@/modules/admin/admin-complaints.types';
import { COMPLAINT_TYPE_LABELS, getCountdownColor, getStatusStyle } from '@/modules/admin/admin-complaints.types';
import { markComplaintInReviewAction, respondComplaintAction } from '@/app/actions/admin-complaint.actions';

function formatMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface ComplaintDetailProps {
  complaint: AdminComplaintDetail;
  submittedDateDisplay: string;
  legalDeadlineDisplay: string;
  respondedAtDisplay: string | null;
}

export function ComplaintDetail({ complaint, submittedDateDisplay, legalDeadlineDisplay, respondedAtDisplay }: ComplaintDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showReviewConfirm, setShowReviewConfirm] = useState(false);
  const [showRespondDialog, setShowRespondDialog] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const statusStyle = getStatusStyle(complaint.status);
  const countdownColors = getCountdownColor(complaint.businessDaysRemaining, complaint.isOverdue);

  const handleMarkInReview = async () => {
    const result = await markComplaintInReviewAction(complaint.id);
    if (!result.ok) {
      setError(result.message ?? 'No se pudo marcar en revisión.');
      return;
    }
    router.refresh();
  };

  const handleRespond = () => {
    setError(null);
    startTransition(async () => {
      const result = await respondComplaintAction(complaint.id, responseText);
      if (!result.ok) {
        setError(result.message ?? 'No se pudo enviar la respuesta.');
        return;
      }
      setShowRespondDialog(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">
            Reclamo #{String(complaint.correlativeNumber).padStart(2, '0')}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{COMPLAINT_TYPE_LABELS[complaint.type]}</Badge>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {statusStyle.label}
            </span>
            {complaint.status !== 'RESPONDIDO' && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${countdownColors.bg} ${countdownColors.text} ${countdownColors.border}`}>
                {complaint.isOverdue && <AlertTriangle className="h-3 w-3" />}
                {complaint.businessDaysRemaining < 0
                  ? `${Math.abs(complaint.businessDaysRemaining)}d vencido`
                  : `${complaint.businessDaysRemaining}d restantes`}
              </span>
            )}
          </div>
        </div>

        {complaint.status !== 'RESPONDIDO' && (
          <div className="flex items-center gap-2 shrink-0">
            {complaint.status === 'REGISTRADO' && (
              <Button variant="outline" size="sm" onClick={() => setShowReviewConfirm(true)} className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Marcar en revisión
              </Button>
            )}
            <Dialog open={showRespondDialog} onOpenChange={(v) => { setShowRespondDialog(v); if (!v) { setResponseText(''); setError(null); } }}>
              <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
                <Send className="h-3.5 w-3.5" /> Responder
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Responder reclamo #{String(complaint.correlativeNumber).padStart(2, '0')}
                  </DialogTitle>
                  <DialogDescription>
                    La respuesta se envía al consumidor y cierra la reclamación — no se puede editar después.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Escribe la respuesta formal a la reclamación..."
                    rows={6}
                    autoFocus
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" disabled={isPending} />}>
                    Cancelar
                  </DialogClose>
                  <Button onClick={handleRespond} disabled={isPending || !responseText.trim()} className="gap-1.5">
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Enviar respuesta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {error && !showRespondDialog && <p className="text-xs text-destructive">{error}</p>}

      {/* Plazo legal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Plazo legal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DataRow label="Ingresado" value={submittedDateDisplay} />
            <DataRow label="Vence" value={legalDeadlineDisplay} />
            <DataRow label="Días hábiles transcurridos" value={complaint.businessDaysElapsed} />
            <DataRow label="Días hábiles restantes" value={complaint.businessDaysRemaining} />
          </div>
        </CardContent>
      </Card>

      {/* Consumidor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Consumidor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Nombre</span>
              <Link href={`/admin/users/${complaint.userId}`} className="text-sm font-medium text-primary hover:underline">
                {complaint.consumerName}
              </Link>
            </div>
            <DataRow label="Documento" value={complaint.consumerDocument} mono />
            <DataRow label="Teléfono" value={complaint.consumerPhone} />
            <DataRow label="Email" value={complaint.consumerEmail} />
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Crédito relacionado</span>
              {complaint.relatedCreditId ? (
                <Link href={`/admin/credits/${complaint.relatedCreditId}`} className="text-sm font-medium text-primary hover:underline font-mono">
                  {complaint.relatedCreditId}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground italic">General — no asociado a un crédito específico</span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground italic mt-3">
            Estos datos son una foto del momento en que se registró el reclamo (Anexo I) — no cambian si el usuario edita su perfil después.
          </p>
        </CardContent>
      </Card>

      {/* Detalle del reclamo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Detalle del reclamo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataRow label="Producto / servicio" value={complaint.productServiceDetail} />
            <DataRow label="Monto involucrado" value={complaint.amountInvolved != null ? formatMoney(complaint.amountInvolved) : null} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Detalle</p>
            <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/30 p-3">{complaint.complaintDetail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pedido concreto del consumidor</p>
            <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/30 p-3">{complaint.consumerRequest}</p>
          </div>
        </CardContent>
      </Card>

      {/* Respuesta */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Respuesta
            {complaint.wasRespondedLate != null && (
              <Badge variant={complaint.wasRespondedLate ? 'error' : 'success'} className="ml-auto">
                {complaint.wasRespondedLate ? 'Respondida fuera de plazo' : 'Respondida a tiempo'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complaint.status === 'RESPONDIDO' ? (
            <div className="space-y-3">
              <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/30 p-3">{complaint.responseText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataRow label="Respondido" value={respondedAtDisplay} />
                <DataRow label="Respondido por" value={complaint.respondedBy} mono />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Todavía no se ha respondido esta reclamación.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmAction
        open={showReviewConfirm}
        onOpenChange={setShowReviewConfirm}
        title="¿Marcar en revisión?"
        description="El reclamo pasará de REGISTRADO a EN_REVISION. Esto no cierra el plazo legal ni cuenta como respuesta."
        confirmLabel="Marcar en revisión"
        onConfirm={handleMarkInReview}
      />
    </div>
  );
}
