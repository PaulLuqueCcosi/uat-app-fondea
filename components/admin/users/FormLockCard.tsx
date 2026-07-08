'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Unlock, RefreshCw, Lock, Loader2 } from 'lucide-react';
import type { FormLock } from '@/modules/admin';
import { unlockFormAction, resetAttemptsAction, blockFormAction } from '@/app/actions/admin-forms.actions';

interface FormLockCardProps {
  lock: FormLock;
  userId?: string;
  formType?: string;
}

export function FormLockCard({ lock, userId, formType }: FormLockCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAction = (action: 'unlock' | 'reset' | 'block') => {
    if (!userId || !formType) return;
    setMessage(null);

    startTransition(async () => {
      let result: { ok: boolean; message?: string };

      switch (action) {
        case 'unlock':
          result = await unlockFormAction(userId, formType);
          break;
        case 'reset':
          result = await resetAttemptsAction(userId, formType);
          break;
        case 'block':
          result = await blockFormAction(userId, formType);
          break;
      }

      if (result.ok) {
        const messages = {
          unlock: 'Desbloqueado exitosamente',
          reset: 'Intentos reseteados',
          block: 'Bloqueado por 24 horas',
        };
        setMessage({ type: 'success', text: messages[action] });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.message ?? 'Error en la operación' });
      }
    });
  };

  const showBar = lock.maxAttempts > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Control de intentos</CardTitle>
          {lock.isBlocked && <Badge variant="error" className="text-[10px]">BLOQUEADO</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showBar ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Intentos fallidos</span>
              <span className="text-sm font-mono">{lock.failedAttempts} / {lock.maxAttempts}</span>
            </div>

            {/* Barra visual */}
            <div className="flex gap-1">
              {Array.from({ length: lock.maxAttempts }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < lock.failedAttempts ? 'bg-destructive' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {lock.blockedUntil && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bloqueado hasta</span>
                <span className="text-sm font-mono">{new Date(lock.blockedUntil).toLocaleString('es-PE')}</span>
              </div>
            )}

            {lock.hoursRemaining != null && lock.hoursRemaining > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Horas restantes</span>
                <span className="text-sm font-mono">{lock.hoursRemaining}h</span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sin intentos registrados</p>
        )}

        {/* Feedback */}
        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
            {message.text}
          </p>
        )}

        <Separator />

        {/* Acciones */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleAction('unlock')}
            disabled={isPending || (!lock.isBlocked && lock.failedAttempts === 0)}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Unlock className="h-3.5 w-3.5 mr-1" />}
            Desbloquear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleAction('reset')}
            disabled={isPending || lock.failedAttempts === 0}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Resetear intentos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-destructive border-destructive/30"
            onClick={() => handleAction('block')}
            disabled={isPending || lock.isBlocked}
          >
            <Lock className="h-3.5 w-3.5 mr-1" /> Bloquear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
