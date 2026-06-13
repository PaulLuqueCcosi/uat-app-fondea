'use client';

import { useState } from 'react';
import {
  Lock,
  Link2,
  Globe,
  Trash2,
  Unlink,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { UserSecurity } from '@/modules/profile';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { LinkGoogleDialog } from './LinkGoogleDialog';
import {
  verifyIdentity,
  unlinkGoogle,
} from '@/app/actions/profile.actions';

interface SecuritySectionProps {
  security: UserSecurity;
  currentEmail: string;
}

export function SecuritySection({ security, currentEmail }: SecuritySectionProps) {
  return (
    <div className="space-y-4">
      {/* Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Contraseña
          </CardTitle>
          <CardAction>
            <ChangePasswordDialog hasPassword={security.hasPassword} currentEmail={currentEmail} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {security.hasPassword ? (
            <p className="text-base font-medium text-foreground tracking-widest">••••••••••</p>
          ) : (
            <>
              <p className="text-base font-medium text-muted-foreground">Sin contraseña</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea una para iniciar sesión con email además de Google.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cuenta de Google */}
      <GoogleAccountCard
        security={security}
        currentEmail={currentEmail}
      />

      {/* Eliminar cuenta */}
      <Card className="border-error-200">
        <CardHeader>
          <CardTitle className="text-error-700 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Eliminar cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Se eliminarán todos tus datos permanentemente. Esta acción no se puede deshacer.
          </p>
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" size="sm" className="gap-1.5" />}>
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar mi cuenta
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <DialogDescription>
                  Esta acción es irreversible. Se eliminarán todos tus datos, historial y documentos.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button variant="destructive" className="gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Sí, eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Google Account Card ───────────────────────────────────────────────────────

function GoogleAccountCard({ security, currentEmail }: { security: UserSecurity; currentEmail: string }) {
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlinkStep, setUnlinkStep] = useState<'confirm' | null>(null);
  const [password, setPassword] = useState('');
  const [verificationId, setVerificationId] = useState('');

  const handleUnlink = async () => {
    setUnlinkLoading(true);
    setError(null);

    const result = await unlinkGoogle(verificationId);

    setUnlinkLoading(false);
    if (!result.success) {
      setError(result.error ?? 'No se pudo desvincular');
      return;
    }

    window.location.reload();
  };

  const handleVerifyForUnlink = async () => {
    setUnlinkLoading(true);
    setError(null);

    const result = await verifyIdentity(password);
    setUnlinkLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Contraseña incorrecta');
      return;
    }
    setVerificationId(result.verificationRecordId ?? '');
    setUnlinkStep('confirm');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Cuenta vinculada
        </CardTitle>
      </CardHeader>
      <CardContent>
        {security.linkedAccounts.length > 0 ? (
          <div className="space-y-3">
            {security.linkedAccounts.map((account, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize text-foreground">{account.provider}</p>
                    <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                  </div>
                </div>
              </div>
            ))}

            {error && <p className="text-xs text-error-600">{error}</p>}

            {security.hasPassword ? (
              <Dialog>
                <DialogTrigger render={<Button variant="outline" size="sm" className="w-full gap-1.5 text-error-600 border-error-200 hover:bg-error-50" />}>
                  <Unlink className="w-3.5 h-3.5" />
                  Desvincular Google
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  {!unlinkStep && (
                    <>
                      <DialogHeader>
                        <DialogTitle>Verificar identidad</DialogTitle>
                        <DialogDescription>
                          Ingresa tu contraseña para confirmar la desvinculación.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tu contraseña"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {error && <p className="text-xs text-error-600">{error}</p>}
                      </div>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                          Cancelar
                        </DialogClose>
                        <Button
                          onClick={handleVerifyForUnlink}
                          disabled={unlinkLoading || !password}
                          className="gap-1.5"
                        >
                          {unlinkLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Verificar
                        </Button>
                      </DialogFooter>
                    </>
                  )}

                  {unlinkStep === 'confirm' && (
                    <>
                      <DialogHeader>
                        <DialogTitle>¿Desvincular cuenta de Google?</DialogTitle>
                        <DialogDescription>
                          Ya no podrás iniciar sesión con Google. Solo podrás acceder con tu correo y contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      {error && <p className="text-xs text-error-600 px-6">{error}</p>}
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                          Cancelar
                        </DialogClose>
                        <Button
                          variant="destructive"
                          className="gap-1.5"
                          onClick={handleUnlink}
                          disabled={unlinkLoading}
                        >
                          {unlinkLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <Unlink className="w-3.5 h-3.5" />
                          Confirmar
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            ) : (
              <p className="text-[10px] text-muted-foreground text-center">
                Crea una contraseña antes de poder desvincular.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Sin cuentas vinculadas</p>
            {error && <p className="text-xs text-error-600 mt-2">{error}</p>}
            <LinkGoogleDialog hasPassword={security.hasPassword} currentEmail={currentEmail} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
