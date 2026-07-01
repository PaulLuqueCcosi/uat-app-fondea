'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Unlock, RefreshCw, Lock } from 'lucide-react';
import type { FormLock } from '@/modules/admin';

interface FormLockCardProps {
  lock: FormLock;
  onUnlock?: () => void;
  onResetAttempts?: () => void;
  onBlock?: () => void;
}

export function FormLockCard({ lock, onUnlock, onResetAttempts, onBlock }: FormLockCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Control de intentos</CardTitle>
          {lock.isBlocked && <Badge variant="error" className="text-[10px]">BLOQUEADO</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={onUnlock}>
            <Unlock className="h-3.5 w-3.5 mr-1" /> Desbloquear
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={onResetAttempts}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Resetear intentos
          </Button>
          <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive/30" onClick={onBlock}>
            <Lock className="h-3.5 w-3.5 mr-1" /> Bloquear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
