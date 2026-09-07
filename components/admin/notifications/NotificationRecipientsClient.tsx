'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { Mail, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { AdminAlertRecipient } from '@/modules/admin/admin-notification-recipients.types';
import {
  addAdminAlertRecipientAction,
  removeAdminAlertRecipientAction,
  setAdminAlertRecipientActiveAction,
} from '@/app/actions/admin-notification-recipients.actions';

interface NotificationRecipientsClientProps {
  initialRecipients: AdminAlertRecipient[];
}

export function NotificationRecipientsClient({ initialRecipients }: NotificationRecipientsClientProps) {
  const router = useRouter();
  const [recipients, setRecipients] = useState(initialRecipients);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [toDelete, setToDelete] = useState<AdminAlertRecipient | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('El correo es obligatorio.');
      return;
    }

    startTransition(async () => {
      const result = await addAdminAlertRecipientAction({ email: email.trim() });
      if (!result.ok || !result.data) {
        setError(result.message ?? 'No se pudo agregar el destinatario.');
        return;
      }
      setRecipients((prev) => [...prev, result.data!]);
      setEmail('');
      router.refresh();
    });
  };

  const handleToggleActive = (recipient: AdminAlertRecipient) => {
    startTransition(async () => {
      const result = await setAdminAlertRecipientActiveAction(recipient.id, !recipient.active);
      if (!result.ok || !result.data) {
        setError(result.message ?? 'No se pudo actualizar el destinatario.');
        return;
      }
      setRecipients((prev) => prev.map((r) => (r.id === recipient.id ? result.data! : r)));
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const result = await removeAdminAlertRecipientAction(toDelete.id);
    if (!result.ok) {
      setError(result.message ?? 'No se pudo quitar el destinatario.');
      return;
    }
    setRecipients((prev) => prev.filter((r) => r.id !== toDelete.id));
    setToDelete(null);
    router.refresh();
  };

  const activeCount = recipients.filter((r) => r.active).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Destinatarios de alertas
          </span>
        </CardTitle>
        <CardDescription>
          Correos que reciben avisos operativos del sistema — ej. cuando un cliente sube un
          comprobante de pago para revisar. Se les manda una copia a todos los que estén activos.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeCount === 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-warning-50 border border-warning-100 px-3 py-2 text-xs text-warning-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            No hay ningún destinatario activo — las alertas operativas no le van a llegar a nadie
            hasta que agregues o reactives al menos uno.
          </div>
        )}

        {/* Agregar destinatario */}
        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium">Correo</label>
            <Input
              type="email"
              placeholder="operaciones@fondea.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="h-9"
            />
          </div>
          <Button type="submit" disabled={isPending} className="gap-1.5 h-9 shrink-0">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Agregar
          </Button>
        </form>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Lista */}
        {recipients.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-6 text-center">Sin destinatarios configurados.</p>
        ) : (
          <div className="-mx-4 divide-y border-t">
            {recipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{recipient.email}</p>
                  <Badge variant={recipient.active ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                    {recipient.active ? 'Activo' : 'Pausado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={recipient.active}
                    onCheckedChange={() => handleToggleActive(recipient)}
                    disabled={isPending}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setToDelete(recipient)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmAction
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="¿Quitar este destinatario?"
        description={toDelete ? `"${toDelete.email}" dejará de recibir alertas operativas por completo.` : ''}
        confirmLabel="Quitar destinatario"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </Card>
  );
}
