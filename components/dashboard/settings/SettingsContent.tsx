'use client';

import { useState } from 'react';
import {
  Lock,
  Link2,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Unlink,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  verifyPassword,
  unlinkSocialIdentity,
  updatePassword,
} from '@/app/actions/account.actions';
import type { UserSecurity } from '@/lib/user/types';

interface SettingsContentProps {
  security: UserSecurity;
}

export function SettingsContent({ security }: SettingsContentProps) {
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);

  // Puede desvincular solo si tiene contraseña (otro método de acceso)
  const canUnlink = security.hasPassword;

  const handleUnlink = async (target: string) => {
    setUnlinkTarget(target);
    setPasswordModal(true);
    setPassword('');
    setError(null);
  };

  const confirmUnlink = async () => {
    if (!password || !unlinkTarget) return;
    setUnlinkLoading(true);
    setError(null);

    // 1. Verificar contraseña
    const verify = await verifyPassword(password);
    if (!verify.success || !verify.verificationRecordId) {
      setError(verify.error || 'Contraseña incorrecta');
      setUnlinkLoading(false);
      return;
    }

    // 2. Desvincular
    const unlink = await unlinkSocialIdentity(unlinkTarget, verify.verificationRecordId);
    if (!unlink.success) {
      setError(unlink.error || 'No se pudo desvincular');
      setUnlinkLoading(false);
      return;
    }

    setUnlinkLoading(false);
    setPasswordModal(false);
    // TODO: refrescar los datos (revalidate o router.refresh)
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contraseña */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground">Contraseña</p>
            </div>
            {security.hasPassword ? (
              <>
                <p className="text-sm font-medium text-foreground">••••••••••</p>
                <p className="text-[10px] text-muted-foreground">Configurada</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No tienes contraseña. Iniciaste con Google.</p>
            )}
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {security.hasPassword ? 'Cambiar' : 'Crear'}
            </Button>
          </CardContent>
        </Card>

        {/* Cuentas vinculadas */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Link2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground">Google</p>
            </div>
            {security.linkedAccounts.length > 0 ? (
              <div className="space-y-2">
                {security.linkedAccounts.map((account, i) => (
                  <div key={i} className="rounded-lg border border-border p-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium capitalize text-foreground">{account.provider}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{account.email}</p>
                      </div>
                      <CheckCircle className="w-3.5 h-3.5 text-success-600 shrink-0" />
                    </div>
                    {canUnlink && (
                      <Button
                        variant="outline"
                        size="xs"
                        className="w-full gap-1 text-error-600 border-error-200 hover:bg-error-50"
                        onClick={() => handleUnlink(account.provider)}
                      >
                        <Unlink className="w-3 h-3" />
                        Desvincular
                      </Button>
                    )}
                    {!canUnlink && (
                      <p className="text-[9px] text-muted-foreground">
                        Crea una contraseña primero para poder desvincular
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin cuenta vinculada</p>
            )}
          </CardContent>
        </Card>

        {/* Zona de peligro */}
        <Card className="border-error-200">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-error-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-error-600" />
              </div>
              <p className="text-xs font-semibold text-error-700">Zona de peligro</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Eliminar tu cuenta borra todos tus datos permanentemente.
            </p>
            <Button variant="destructive" size="sm" className="w-full gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar cuenta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación con contraseña */}
      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPasswordModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground">Confirma tu identidad</h3>
            <p className="text-xs text-muted-foreground">
              Ingresa tu contraseña para desvincular la cuenta de Google.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
              autoFocus
            />
            {error && (
              <p className="text-xs text-error-600">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPasswordModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={confirmUnlink}
                disabled={!password || unlinkLoading}
              >
                {unlinkLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Desvincular
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
