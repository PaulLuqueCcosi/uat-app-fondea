'use client';

import { useState } from 'react';
import { Globe, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  verifyIdentity,
  sendIdentityVerificationCode,
  verifyIdentityCode,
  startLinkGoogle,
} from '@/app/actions/profile.actions';

/**
 * Dialog para vincular Google:
 * Step 1: Verificar identidad (contraseña o código email)
 * Step 1b: Verificar código (si no tiene contraseña)
 * Step 2: Redirigir a Google OAuth
 */

type Step = 'verify-identity' | 'verify-code' | 'redirecting';

interface LinkGoogleDialogProps {
  hasPassword: boolean;
  currentEmail: string;
}

export function LinkGoogleDialog({ hasPassword, currentEmail }: LinkGoogleDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('verify-identity');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState('');

  const reset = () => {
    setStep('verify-identity');
    setPassword('');
    setCode('');
    setError(null);
    setVerificationId('');
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
  };

  const handleVerifyIdentity = async () => {
    setLoading(true);
    setError(null);

    if (hasPassword) {
      const result = await verifyIdentity(password);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? 'Contraseña incorrecta');
        return;
      }
      setVerificationId(result.verificationRecordId ?? '');
      // Iniciar flujo OAuth directamente
      await startOAuthFlow(result.verificationRecordId ?? '');
    } else {
      const result = await sendIdentityVerificationCode(currentEmail);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? 'No se pudo enviar el código');
        return;
      }
      setVerificationId(result.verificationRecordId ?? '');
      setStep('verify-code');
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError(null);

    const result = await verifyIdentityCode(currentEmail, verificationId, code);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Código incorrecto');
      return;
    }

    const finalVerificationId = result.verificationRecordId ?? verificationId;
    setVerificationId(finalVerificationId);
    await startOAuthFlow(finalVerificationId);
  };

  const startOAuthFlow = async (identityVerId: string) => {
    setLoading(true);
    setStep('redirecting');

    const callbackUrl = `${window.location.origin}/dashboard/profile/link-google-callback`;
    const linkResult = await startLinkGoogle(callbackUrl);

    if (!linkResult.success || !linkResult.authorizationUrl) {
      setLoading(false);
      setStep('verify-identity');
      setError(linkResult.error ?? 'No se pudo iniciar la vinculación');
      return;
    }

    // Guardar IDs en sessionStorage para el callback
    sessionStorage.setItem('linkGoogle_socialVerificationId', linkResult.verificationRecordId ?? '');
    sessionStorage.setItem('linkGoogle_identityVerificationId', identityVerId);

    // Redirigir a Google
    window.location.href = linkResult.authorizationUrl;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="mt-3 gap-1.5" />}>
        <Globe className="w-3.5 h-3.5" />
        Vincular Google
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* Step 1: Verificar identidad */}
        {step === 'verify-identity' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                Verifica tu identidad
              </DialogTitle>
              <DialogDescription>
                {hasPassword
                  ? 'Ingresa tu contraseña para vincular tu cuenta de Google.'
                  : `Te enviaremos un código a ${currentEmail} para confirmar tu identidad.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {hasPassword ? (
                <div className="grid gap-2">
                  <Label htmlFor="link-google-pw">Contraseña</Label>
                  <Input
                    id="link-google-pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Se enviará un código a{' '}
                    <span className="font-medium text-foreground">{currentEmail}</span>
                  </p>
                </div>
              )}
              {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button
                onClick={handleVerifyIdentity}
                disabled={loading || (hasPassword && !password)}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {hasPassword ? 'Continuar' : 'Enviar código'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 1b: Verificar código */}
        {step === 'verify-code' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Código de verificación
              </DialogTitle>
              <DialogDescription>
                Ingresa el código de 6 dígitos que enviamos a{' '}
                <span className="font-medium">{currentEmail}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="link-google-code">Código</Label>
                <Input
                  id="link-google-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  className="text-center text-lg tracking-widest"
                />
              </div>
              {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length < 6}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Continuar
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Redirecting */}
        {step === 'redirecting' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Conectando con Google...
              </DialogTitle>
              <DialogDescription>
                Serás redirigido a Google para autorizar la vinculación.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
