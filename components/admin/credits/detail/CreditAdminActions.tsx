'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ShieldOff,
  ShieldCheck,
  Ban,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { CreditStatus } from '@/modules/admin/credit-status-labels';
import {
  suspendCreditAction,
  reactivateCreditAction,
  writeOffCreditAction,
} from '@/app/actions/admin-credits.actions';

interface Props {
  creditId: string;
  status: CreditStatus;
}

/**
 * Acciones administrativas manuales de un crédito: suspender, reactivar, castigar.
 *
 * Estas operaciones NUNCA se muestran en la tabla de créditos — solo acá, en el
 * detalle de UN crédito específico, para forzar al admin a revisar el contexto
 * completo (estado, cuotas, timeline) antes de ejecutar algo que queda registrado
 * en auditoría y puede tener efecto contable real.
 *
 * Los botones solo se habilitan según el estado actual (mismas reglas que valida
 * el dominio en Credit.java — markSuspended/markReactivated/markWrittenOff):
 *   - Suspender: cualquier estado excepto PAID_OFF y SUSPENDED.
 *   - Reactivar: solo si está SUSPENDED.
 *   - Castigar:  solo si está OVERDUE.
 * El backend vuelve a validar esto igual (es la fuente de verdad) — acá solo
 * evitamos que el admin dispare una acción que el backend rechazaría de entrada.
 */
export function CreditAdminActions({ creditId, status }: Props) {
  const canSuspend = status !== 'PAID_OFF' && status !== 'SUSPENDED';
  const canReactivate = status === 'SUSPENDED';
  const canWriteOff = status === 'OVERDUE';

  if (!canSuspend && !canReactivate && !canWriteOff) return null;

  return (
    <div className="flex items-center gap-2">
      {canSuspend && <SuspendAction creditId={creditId} />}
      {canReactivate && <ReactivateAction creditId={creditId} />}
      {canWriteOff && <WriteOffAction creditId={creditId} />}
    </div>
  );
}

// ─── Suspender ──────────────────────────────────────────────────────────────────

function SuspendAction({ creditId }: { creditId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const trimmedReason = reason.trim();

  const handleConfirm = () => {
    if (!trimmedReason) return;
    startTransition(async () => {
      const result = await suspendCreditAction(creditId, trimmedReason);
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
    <AlertDialog open={open} onOpenChange={(v) => { if (!isPending) { setOpen(v); if (!v) setReason(''); } }}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" className="gap-1.5 text-xs" />}>
        <ShieldOff className="h-3.5 w-3.5" />
        Suspender
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Suspender este crédito
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            El crédito deja de acumular mora y <strong className="text-foreground">rechaza cualquier pago o negociación</strong> mientras
            esté suspendido — incluidos los depósitos que el cliente ya declaró y estén
            pendientes de aprobación. Solo vuelve a la normalidad si otro admin lo
            reactiva. Se registra en auditoría con tu usuario. El motivo es obligatorio.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5 text-left">
          <Label htmlFor="suspend-reason" className="text-xs">Motivo de la suspensión</Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: orden judicial, sospecha de fraude, disputa del cliente..."
            rows={3}
            disabled={isPending}
            autoFocus
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || !trimmedReason}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Suspender crédito
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Reactivar ──────────────────────────────────────────────────────────────────

function ReactivateAction({ creditId }: { creditId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await reactivateCreditAction(creditId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!isPending) setOpen(v); }}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-xs" />}>
        <ShieldCheck className="h-3.5 w-3.5" />
        Reactivar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reactivar este crédito</AlertDialogTitle>
          <AlertDialogDescription>
            El crédito vuelve a Activo o Vencido según si tiene cuotas pendientes de
            pago, y retoma la acumulación de mora normal. Se registra en auditoría con
            tu usuario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Reactivar crédito
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Castigar (WRITTEN_OFF) ─────────────────────────────────────────────────────

function WriteOffAction({ creditId }: { creditId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleConfirm = () => {
    if (!understood) return;
    startTransition(async () => {
      const result = await writeOffCreditAction(creditId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      setUnderstood(false);
      router.refresh();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!isPending) { setOpen(v); if (!v) setUnderstood(false); } }}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" className="gap-1.5 text-xs" />}>
        <Ban className="h-3.5 w-3.5" />
        Castigar
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Castigar este crédito
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-2">
            <span className="block">
              Es una decisión contable grave: el crédito sale del balance activo y se
              reconoce la pérdida en el fondo de capital de inmediato, en la misma
              operación.
            </span>
            <span className="block font-medium text-foreground">
              Si el cliente paga después de forma voluntaria, el crédito puede
              recuperarse, pero el ajuste de esa pérdida en el fondo NO se revierte
              solo — hay que corregirlo a mano desde Fondo de Capital.
            </span>
            <span className="block">Esta acción queda registrada en auditoría con tu usuario.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex items-start gap-2 text-xs text-foreground/90 cursor-pointer select-none">
          <Checkbox
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked === true)}
            disabled={isPending}
            className="mt-0.5"
          />
          Entiendo que esta acción reporta una pérdida real al fondo y que su reversión,
          si aplica, no es automática.
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || !understood}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Castigar crédito
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
