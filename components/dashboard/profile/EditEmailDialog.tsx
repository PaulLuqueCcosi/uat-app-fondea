'use client';

import { useState } from 'react';
import { Pencil, Loader2, Mail, ShieldCheck, KeyRound } from 'lucide-react';
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
import { updateEmail } from '@/lib/user/actions';

/**
 * Flujo para cambiar email (alineado con Logto Account API):
 * 
 * Step 1: Verificar identidad (contraseña o código al email actual)
 * Step 2: Ingresar nuevo email
 * Step 3: Verificar nuevo email (código enviado al nuevo correo)
 * Step 4: Confirmación
 */

type Step = 'verify-identity' | 'new-email' | 'verify-code' | 'success';

interface EditEmailDialogProps {
  currentEmail: string;
  hasPassword: boolean;
}

export function EditEmailDialog({ currentEmail, hasPassword }: EditEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('verify-identity');
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('verify-identity');
    setPassword('');
    setNewEmail('');
    setCode('');
    setError(null);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
  };

  const handleVerifyIdentity = async () => {
    setLoading(true);
    setError(null);
    // TODO: llamar verifyPassword(password) real
    await new Promise((r) => setTimeout(r, 800));
    // Simular éxito
    setLoading(false);
    setStep('new-email');
  };

  const handleSendCode = async () => {
    setLoading(true);
    setError(null);
    // TODO: llamar a Logto para enviar código al nuevo email
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep('verify-code');
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError(null);
    // TODO: verificar código + actualizar email
    await updateEmail(newEmail);
    setLoading(false);
    setStep('success');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Pencil className="w-3.5 h-3.5" />
        Editar
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
                  ? 'Ingresa tu contraseña para confirmar que eres tú.'
                  : 'Te enviaremos un código a tu correo actual para confirmar tu identidad.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {hasPassword ? (
                <div className="grid gap-2">
                  <Label htmlFor="verify-password">Contraseña</Label>
                  <Input
                    id="verify-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Se enviará un código de verificación a <span className="font-medium text-foreground">{currentEmail}</span>
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
                {hasPassword ? 'Verificar' : 'Enviar código'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Ingresar nuevo email */}
        {step === 'new-email' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Nuevo correo electrónico
              </DialogTitle>
              <DialogDescription>
                Ingresa el nuevo correo. Te enviaremos un código para verificarlo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="current-email-display">Correo actual</Label>
                <Input id="current-email-display" value={currentEmail} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-email-input">Nuevo correo</Label>
                <Input
                  id="new-email-input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nuevo@correo.com"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('verify-identity')}>
                Atrás
              </Button>
              <Button
                onClick={handleSendCode}
                disabled={loading || !newEmail || newEmail === currentEmail}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enviar código
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Verificar código */}
        {step === 'verify-code' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Verificar código
              </DialogTitle>
              <DialogDescription>
                Ingresa el código de 6 dígitos que enviamos a <span className="font-medium">{newEmail}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="verify-email-code">Código de verificación</Label>
                <Input
                  id="verify-email-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                ¿No recibiste el código?{' '}
                <button className="text-primary font-medium hover:underline" onClick={handleSendCode}>
                  Reenviar
                </button>
              </p>
              {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('new-email')}>
                Atrás
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length < 6}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 4: Éxito */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success-700">
                <ShieldCheck className="w-4 h-4" />
                ¡Correo actualizado!
              </DialogTitle>
              <DialogDescription>
                Tu correo electrónico ha sido cambiado a <span className="font-medium">{newEmail}</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => { setOpen(false); window.location.reload(); }}>
                Listo
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
