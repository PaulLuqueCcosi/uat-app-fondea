'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateComplianceProfileAction } from '@/app/actions/admin-penalty.actions';
import type { ComplianceProfile, ComplianceState } from '@/modules/admin/admin-penalty.types';
import { formatDateTimePeru } from '@/modules/shared/backend-date';
import { penaltyErrorMessage } from './penalty-errors';

export const MIN_REASON_LENGTH = 10;

const PROFILE_NAME: Record<ComplianceProfile, string> = {
  REGULATED: 'Regulado',
  UNREGULATED: 'No regulado',
};

interface Props {
  /** `null` = no se pudo leer el perfil; se trata como regulado (lo más conservador). */
  compliance: ComplianceState | null;
  /** Se llama después de cambiar el perfil, para recargar la pantalla. */
  onChanged: () => void;
}

export function PenaltyComplianceBanner({ compliance, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile: ComplianceProfile = compliance?.profile ?? 'REGULATED';
  const target: ComplianceProfile = profile === 'REGULATED' ? 'UNREGULATED' : 'REGULATED';
  const trimmed = reason.trim();
  const reasonValid = trimmed.length >= MIN_REASON_LENGTH;
  const lastChange = compliance?.history[0];

  function openDialog() {
    setReason('');
    setError(null);
    setOpen(true);
  }

  async function confirm() {
    if (!reasonValid) {
      setError(`El motivo debe tener al menos ${MIN_REASON_LENGTH} caracteres`);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateComplianceProfileAction(target, trimmed);
    setSaving(false);
    if (result.ok) {
      setOpen(false);
      onChanged();
    } else {
      setError(penaltyErrorMessage(result.error, 'No se pudo cambiar el perfil'));
    }
  }

  const regulated = profile === 'REGULATED';

  return (
    <>
      <div
        role="status"
        className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between ${
          regulated ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {regulated ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" aria-hidden="true" />
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Perfil de cumplimiento</p>
              <Badge variant={regulated ? 'success' : 'warning'}>{PROFILE_NAME[profile]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {regulated
                ? 'Con el perfil regulado no se pueden cobrar gastos ni tarifa por el atraso: esas celdas quedan deshabilitadas. Solo corren el interés compensatorio y el moratorio.'
                : 'Con el perfil no regulado se permiten gastos y tarifa por el atraso. Los cobros deben estar informados al cliente en su contrato y tarifario.'}
            </p>
            {!compliance && (
              <p className="text-xs text-warning-700">
                No se pudo leer el perfil guardado; se aplica el regulado por seguridad.
              </p>
            )}
            {lastChange && (
              <p className="text-[11px] text-muted-foreground">
                Último cambio: {formatDateTimePeru(lastChange.changedAt)} · {lastChange.changedBy} · “{lastChange.reason}”
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={openDialog} disabled={!compliance}>
          Cambiar a {PROFILE_NAME[target].toLowerCase()}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar perfil a {PROFILE_NAME[target].toLowerCase()}</DialogTitle>
            <DialogDescription>
              {target === 'UNREGULATED'
                ? 'Se habilitará el cobro de gastos y tarifa por el atraso. Confirma con el área legal antes de hacerlo.'
                : 'Se volverán a bloquear los gastos y la tarifa por el atraso. Las configuraciones guardadas con esos cobros dejarán de poder guardarse.'}{' '}
              El cambio queda registrado con tu usuario y el motivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="compliance-reason" className="text-sm font-medium">Motivo del cambio *</Label>
            <Textarea
              id="compliance-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Legal confirmó que Fondea no está bajo supervisión de la SBS"
              rows={3}
              aria-invalid={error !== null}
              aria-describedby="compliance-reason-help"
            />
            <p id="compliance-reason-help" className="text-[11px] text-muted-foreground">
              Mínimo {MIN_REASON_LENGTH} caracteres ({trimmed.length}/{MIN_REASON_LENGTH}).
            </p>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={confirm} disabled={saving || !reasonValid}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Confirmar cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
