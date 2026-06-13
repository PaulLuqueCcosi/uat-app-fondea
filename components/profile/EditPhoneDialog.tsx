'use client';

import { useState } from 'react';
import { Pencil, Loader2, Phone, ShieldCheck, KeyRound, Plus } from 'lucide-react';
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
  sendPhoneVerificationCode,
  verifyPhoneCode,
  confirmPhoneChange,
} from '@/app/actions/profile.actions';
import { formatPhoneForDisplay } from '@/modules/profile';

/**
 * Flujo para cambiar/agregar número de celular (Logto Account API):
 *
 * Step 1: Verificar identidad (contraseña o código al email)
 * Step 1b: Verificar código de identidad (si no tiene contraseña)
 * Step 2: Ingresar nuevo número
 * Step 3: Verificar código SMS enviado al nuevo número
 * Step 4: Confirmación
 */

type Step = 'verify-identity' | 'verify-identity-code' | 'new-phone' | 'verify-code' | 'success';

interface EditPhoneDialogProps {
  currentPhone: string;
  currentEmail: string;
  hasPassword: boolean;
  mode?: 'edit' | 'add';
}

export function EditPhoneDialog({ currentPhone, currentEmail, hasPassword, mode = 'edit' }: EditPhoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('verify-identity');
  const [password, setPassword] = useState('');
  const [identityCode, setIdentityCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IDs de verificación
  const [identityVerificationId, setIdentityVerificationId] = useState('');
  const [phoneVerificationId, setPhoneVerificationId] = useState('');

  const reset = () => {
    setStep('verify-identity');
    setPassword('');
    setIdentityCode('');
    setNewPhone('');
    setCode('');
    setError(null);
    setIdentityVerificationId('');
    setPhoneVerificationId('');
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
  };

  // Formato: agregar +51 si no lo tiene
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('51')) return cleaned;
    return `51${cleaned}`;
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
      setIdentityVerificationId(result.verificationRecordId ?? '');
      setStep('new-phone');
    } else {
      const result = await sendIdentityVerificationCode(currentEmail);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? 'No se pudo enviar el código');
        return;
      }
      setIdentityVerificationId(result.verificationRecordId ?? '');
      setStep('verify-identity-code');
    }
  };

  const handleVerifyIdentityCode = async () => {
    setLoading(true);
    setError(null);

    const result = await verifyIdentityCode(currentEmail, identityVerificationId, identityCode);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Código incorrecto');
      return;
    }

    setIdentityVerificationId(result.verificationRecordId ?? identityVerificationId);
    setStep('new-phone');
  };

  const handleSendCode = async () => {
    const fullPhone = formatPhone(newPhone);

    setLoading(true);
    setError(null);

    const result = await sendPhoneVerificationCode(fullPhone);

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'No se pudo enviar el SMS');
      return;
    }

    setPhoneVerificationId(result.verificationRecordId ?? '');
    setStep('verify-code');
  };

  const handleVerifyCode = async () => {
    const fullPhone = formatPhone(newPhone);

    setLoading(true);
    setError(null);

    // Paso 1: Verificar el código SMS del nuevo número
    const verifyResult = await verifyPhoneCode(fullPhone, phoneVerificationId, code);
    if (!verifyResult.success) {
      setLoading(false);
      setError(verifyResult.error ?? 'Código incorrecto');
      return;
    }

    // Paso 2: Confirmar el cambio de teléfono con ambos IDs
    const confirmResult = await confirmPhoneChange(fullPhone, identityVerificationId, phoneVerificationId);

    setLoading(false);
    if (!confirmResult.success) {
      setError(confirmResult.error ?? 'No se pudo actualizar el número');
      return;
    }

    setStep('success');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        {mode === 'add' ? <Plus className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        {mode === 'add' ? 'Agregar' : 'Editar'}
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
                  : `Te enviaremos un código a ${currentEmail} para confirmar tu identidad.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {hasPassword ? (
                <div className="grid gap-2">
                  <Label htmlFor="phone-verify-pw">Contraseña</Label>
                  <Input
                    id="phone-verify-pw"
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
                disabled={loading || (hasPassword && !password)}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {hasPassword ? 'Verificar' : 'Enviar código'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 1b: Código de identidad (sin contraseña) */}
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
                <Label htmlFor="phone-identity-code">Código</Label>
                <Input
                  id="phone-identity-code"
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

        {/* Step 2: Nuevo número */}
        {step === 'new-phone' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Nuevo número de celular
              </DialogTitle>
              <DialogDescription>
                Ingresa el nuevo número. Te enviaremos un código SMS para verificarlo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {currentPhone && (
                <div className="grid gap-2">
                  <Label htmlFor="current-phone-display">Número actual</Label>
                  <Input id="current-phone-display" value={formatPhoneForDisplay(currentPhone)} disabled />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="new-phone-input">Nuevo número</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground shrink-0">
                    +51
                  </div>
                  <Input
                    id="new-phone-input"
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="999 999 999"
                    autoFocus
                    maxLength={9}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('verify-identity')}>
                Atrás
              </Button>
              <Button
                onClick={handleSendCode}
                disabled={loading || newPhone.length < 9}
                className="gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enviar código SMS
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Verificar código SMS */}
        {step === 'verify-code' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Verificar código SMS
              </DialogTitle>
              <DialogDescription>
                Ingresa el código de 6 dígitos que enviamos al{' '}
                <span className="font-medium">+51 {newPhone}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="verify-phone-code">Código</Label>
                <Input
                  id="verify-phone-code"
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
              <Button variant="outline" onClick={() => setStep('new-phone')}>
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
                ¡Número actualizado!
              </DialogTitle>
              <DialogDescription>
                Tu número de celular ha sido cambiado a{' '}
                <span className="font-medium">+51 {newPhone}</span>
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
