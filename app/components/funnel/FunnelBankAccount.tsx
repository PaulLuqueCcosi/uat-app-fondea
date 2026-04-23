'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, CreditCard, AlertCircle } from 'lucide-react';
import { saveBankAccount } from '@/app/actions/loan.actions';
import type { BankAccount } from '@/lib/types';

export function FunnelBankAccount() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<BankAccount>({
    bank: '',
    accountNumber: '',
    accountType: 'savings',
    cci: '',
  });

  const banks = [
    'BCP',
    'BBVA',
    'Interbank',
    'Scotiabank',
    'Banco de la Nación',
    'Banco Pichincha',
    'BanBif',
    'Falabella',
    'Ripley',
    'Otro',
  ];

  const updateField = (field: keyof BankAccount, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!form.bank) {
      newErrors.bank = 'Selecciona tu banco';
    }

    if (!form.cci.trim()) {
      newErrors.cci = 'El CCI es requerido';
    } else if (!/^\d{20}$/.test(form.cci.trim())) {
      newErrors.cci = 'El CCI debe tener exactamente 20 dígitos';
    }

    if (!form.accountNumber.trim()) {
      newErrors.accountNumber = 'El número de cuenta es requerido';
    } else if (form.accountNumber.trim().length < 10) {
      newErrors.accountNumber = 'Número de cuenta inválido';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await saveBankAccount(form);
      router.push('/funnel/contract');
    } catch (error) {
      console.error('Error saving bank account:', error);
      setErrors({ submit: 'Error al guardar. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Cuenta Bancaria para Desembolso
        </h1>
        <p className="text-fondea-text">
          Ingresa la cuenta donde recibirás el dinero del préstamo.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Info alert */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-dark">
              <p className="font-semibold mb-1">Importante:</p>
              <ul className="space-y-1 list-disc ml-4">
                <li>La cuenta debe estar a tu nombre</li>
                <li>Debe ser una cuenta en soles (PEN)</li>
                <li>El desembolso se realiza en 24-48 horas hábiles</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bank selection */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Banco <span className="text-error">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fondea-text pointer-events-none" />
            <select
              value={form.bank}
              onChange={(e) => updateField('bank', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.bank ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Selecciona tu banco</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
          {errors.bank && <p className="text-sm text-error mt-1">{errors.bank}</p>}
        </div>

        {/* Account type */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Tipo de cuenta <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateField('accountType', 'savings')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                form.accountType === 'savings'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Ahorros
            </button>
            <button
              onClick={() => updateField('accountType', 'checking')}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                form.accountType === 'checking'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Corriente
            </button>
          </div>
        </div>

        {/* Account number */}
        <Input
          label="Número de cuenta"
          value={form.accountNumber}
          onChange={(value) => {
            const cleaned = value.replace(/\D/g, '');
            updateField('accountNumber', cleaned);
          }}
          placeholder="12345678901234"
          icon={<CreditCard className="w-4 h-4" />}
          error={errors.accountNumber}
          helpText="Número de cuenta sin guiones ni espacios"
          required
        />

        {/* CCI */}
        <Input
          label="Código de Cuenta Interbancario (CCI)"
          value={form.cci}
          onChange={(value) => {
            const cleaned = value.replace(/\D/g, '').slice(0, 20);
            updateField('cci', cleaned);
          }}
          placeholder="00212345678901234567"
          icon={<CreditCard className="w-4 h-4" />}
          error={errors.cci}
          helpText="20 dígitos que identifican tu cuenta"
          maxLength={20}
          required
        />

        {/* CCI info */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <p className="text-xs text-fondea-text">
            <strong>¿Dónde encuentro mi CCI?</strong> Lo puedes encontrar en tu app bancaria,
            banca por internet, o solicitándolo en una agencia. Es un código de 20 dígitos.
          </p>
        </div>

        {errors.submit && (
          <div className="p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Guardar para después
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="flex-1"
            size="lg"
          >
            Continuar con el contrato →
          </Button>
        </div>
      </Card>
    </div>
  );
}
