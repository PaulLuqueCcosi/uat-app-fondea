'use client';

import { useState } from 'react';
import { Pencil, Loader2, KeyRound, ShieldCheck, Plus, Eye, EyeOff } from 'lucide-react';
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
  changePassword,
} from '@/app/actions/profile.actions';

/**
 * Flujo para crear/cambiar contraseña:
 *
 * CASO 1 — Ya tiene contraseña:
 *   Step 1: Verificar identidad (contraseña actual)
 *   Step 2: Ingresar nueva contraseña
 *   Step 3: Éxito
 *
 * CASO 2 — No tiene contraseña (solo Google):
 *   Step 1: Verificar identidad (código al email)
 *   Step 1b: Ingresar código recibido
 *   Step 2: Ingresar nueva contraseña
 *   Step 3: Éxito
 */

type Step = 'verify-identity' | 'verify-identity-code' | 'new-password' | 'success';

interface ChangePasswordDialogProps {
  hasPassword: boolean;
  currentEmail: string;
}

export function ChangePasswordDialog({ hasPassword, currentEmail }: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('verify-identity');
  const [currentPassword, setCurrentPassword] = useState('');
  const [identityCode, setIdentityCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [verificationRecordId, setVerificationRecordId] = useState('');

  const reset = () => {
    setStep('verify-identity');
    setCurrentPassword('');
    setIdentityCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setError(null);
    setVerificationRecordId('');
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
  };

  const handleVerifyIdentity = async () => {
    setLoading(true);
    setError(null);

    if (hasPassword) {
      // Verificar con contraseña actual
      const result = await verifyIdentity(currentPassword);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? 'Contraseña incorrecta');
        return;
      }
      setVerificationRecordId(result.verificationRecordId ?? '');
      setStep('new-password');
    } else {
      // Enviar código al email
      const result = await sendIdentityVerificationCode(currentEmail);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? 'No se pudo enviar el código');
        return;
      }
      setVerificationRecordId(result.verificationRecordId ?? '');
      setStep('verify-identity-code');
    }
  };

  const handleVerifyIdentityCode = async () => {
    setLoading(true);
    setError(null);

    const result = await verifyIdentityCode(currentEmail, verificationRecordId, identityCode);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Código incorrecto');
      return;
    }

    setVerificationRecordId(result.verificationRecordId ?? verificationRecordId);
    setStep('new-password');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await changePassword(newPassword, verificationRecordId);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'No se pudo actualizar la contraseña');
      return;
    }

    setStep('success');
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        {hasPassword ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {hasPassword ? 'Editar' : 'Agregar'}
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
                  ? 'Ingresa tu contraseña actual para poder cambiarla.'
                  : `Te enviaremos un código a ${currentEmail} para confirmar tu identidad.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {hasPassword ? (
                <div className="grid gap-2">
                  <Label htmlFor="current-pw">Contraseña actual</Label>
                  <Input
                    id="current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    Se enviará un código de verificación a{' '}
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
                disabled={loading || (hasPassword && !currentPassword)}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {hasPassword ? 'Verificar' : 'Enviar código'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 1b: Verificar código de identidad (sin contraseña) */}
        {step === 'verify-identity-code' && (
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
                <Label htmlFor="pw-identity-code">Código</Label>
                <Input
                  id="pw-identity-code"
                  value={identityCode}
                  onChange={(e) => setIdentityCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                ¿No recibiste el código?{' '}
                <button className="text-primary font-medium hover:underline" onClick={handleVerifyIdentity}>
                  Reenviar
                </button>
              </p>
              {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button
                onClick={handleVerifyIdentityCode}
                disabled={loading || identityCode.length < 6}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Verificar
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Nueva contraseña */}
        {step === 'new-password' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                {hasPassword ? 'Nueva contraseña' : 'Crea tu contraseña'}
              </DialogTitle>
              <DialogDescription>
                {hasPassword
                  ? 'Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.'
                  : 'Crea una contraseña para poder iniciar sesión con email además de Google.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-pw">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-pw">Confirmar contraseña</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
              {/* Validaciones visuales */}
              <div className="space-y-1">
                <p className={`text-[11px] ${passwordValid ? 'text-success-600' : 'text-muted-foreground'}`}>
                  {passwordValid ? '✓' : '○'} Al menos 8 caracteres
                </p>
                <p className={`text-[11px] ${passwordsMatch ? 'text-success-600' : 'text-muted-foreground'}`}>
                  {passwordsMatch ? '✓' : '○'} Las contraseñas coinciden
                </p>
              </div>
              {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('verify-identity')}>
                Atrás
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={loading || !passwordValid || !passwordsMatch}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Éxito */}
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success-700">
                <ShieldCheck className="w-4 h-4" />
                {hasPassword ? '¡Contraseña actualizada!' : '¡Contraseña creada!'}
              </DialogTitle>
              <DialogDescription>
                {hasPassword
                  ? 'Tu contraseña ha sido cambiada exitosamente.'
                  : 'Ahora puedes iniciar sesión con tu email y contraseña además de Google.'}
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
