'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlayCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { unblockDocumentVerificationAction } from '@/app/actions/admin-application.actions';

/**
 * Levanta la pausa temporal de la verificación de documentos antes de que pasen las 24h.
 * El paso que agotó sus intentos recupera sus vidas y el cliente puede continuar ya. El motivo es
 * obligatorio porque la acción queda en la auditoría con el admin que la ejecutó. El backend vuelve a
 * validar (pre-aprobación vigente y pausa activa), acá solo se muestra su respuesta.
 */
export function UnblockDocumentsAction({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const trimmedReason = reason.trim();

  const handleConfirm = () => {
    if (!trimmedReason) return;
    startTransition(async () => {
      const result = await unblockDocumentVerificationAction(applicationId, trimmedReason);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      setReason('');
      router.refresh();
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) {
          setOpen(v);
          if (!v) setReason('');
        }
      }}
    >
      <AlertDialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-xs" />}>
        <PlayCircle className="h-3.5 w-3.5" />
        Levantar pausa
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Levantar la pausa de verificación</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            El cliente podrá continuar ahora mismo y el paso que agotó sus intentos recupera todas sus vidas.
            No cambia el estado de la solicitud ni su fecha de vencimiento. Se registra en la auditoría con tu
            usuario. El motivo es obligatorio.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5 text-left">
          <Label htmlFor="unblock-reason" className="text-xs">Motivo</Label>
          <Textarea
            id="unblock-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: el cliente llamó y confirmamos su identidad por otro medio..."
            rows={3}
            disabled={isPending}
            autoFocus
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending || !trimmedReason}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Levantar pausa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
