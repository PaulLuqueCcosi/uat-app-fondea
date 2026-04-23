'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { StickyBottomBar } from '@/app/components/ui/StickyBottomBar';
import { DollarSign, TrendingUp, CreditCard, Plus, X } from 'lucide-react';
import { saveEconomicProfile } from '@/app/actions/loan.actions';
import type { EconomicData, Debt } from '@/lib/types';

interface FunnelEconomicProfileProps {
  dashboardMode?: boolean;
}

export function FunnelEconomicProfile({ dashboardMode }: FunnelEconomicProfileProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<EconomicData>({
    monthlyIncome: 0,
    otherIncome: 0,
    monthlyExpenses: 0,
    hasDebts: false,
    debts: [],
    hasSavings: false,
    savingsAmount: 0,
  });

  const updateField = (field: keyof EconomicData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const addDebt = () => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      entity: '',
      type: 'personal',
      amount: 0,
      monthlyPayment: 0,
    };
    updateField('debts', [...form.debts, newDebt]);
  };

  const updateDebt = (id: string, field: keyof Debt, value: any) => {
    const updated = form.debts.map(debt =>
      debt.id === id ? { ...debt, [field]: value } : debt
    );
    updateField('debts', updated);
  };

  const removeDebt = (id: string) => {
    updateField('debts', form.debts.filter(d => d.id !== id));
  };

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!form.monthlyIncome || form.monthlyIncome <= 0) {
      newErrors.monthlyIncome = 'El ingreso mensual es requerido';
    }

    if (form.monthlyIncome < 1000) {
      newErrors.monthlyIncome = 'El ingreso mensual debe ser al menos S/ 1,000';
    }

    if (!form.monthlyExpenses || form.monthlyExpenses < 0) {
      newErrors.monthlyExpenses = 'Los gastos mensuales son requeridos';
    }

    if (form.monthlyExpenses >= form.monthlyIncome) {
      newErrors.monthlyExpenses = 'Los gastos no pueden ser mayores o iguales a los ingresos';
    }

    if (form.hasDebts && form.debts.length === 0) {
      newErrors.debts = 'Debes agregar al menos una deuda';
    }

    if (form.hasDebts) {
      form.debts.forEach((debt, idx) => {
        if (!debt.entity.trim()) {
          newErrors[`debt_${idx}_entity`] = 'La entidad es requerida';
        }
        if (!debt.amount || debt.amount <= 0) {
          newErrors[`debt_${idx}_amount`] = 'El monto es requerido';
        }
        if (!debt.monthlyPayment || debt.monthlyPayment <= 0) {
          newErrors[`debt_${idx}_payment`] = 'La cuota mensual es requerida';
        }
      });
    }

    if (form.hasSavings && (!form.savingsAmount || form.savingsAmount <= 0)) {
      newErrors.savingsAmount = 'El monto de ahorros es requerido';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await saveEconomicProfile(form);
      if (dashboardMode) {
        router.push('/dashboard');
      } else {
        router.push('/funnel/references');
      }
    } catch (error) {
      console.error('Error saving economic profile:', error);
      setErrors({ submit: 'Error al guardar. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Ingresos */}
      <div>
        <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Ingresos Mensuales
        </h3>
        <div className="space-y-4">
          <Input
            label="Ingreso mensual principal"
            type="number"
            value={form.monthlyIncome || ''}
            onChange={(value) => updateField('monthlyIncome', Number(value))}
            placeholder="Ej: 3500"
            icon={<DollarSign className="w-4 h-4" />}
            error={errors.monthlyIncome}
            required
          />
          <Input
            label="Otros ingresos (opcional)"
            type="number"
            value={form.otherIncome || ''}
            onChange={(value) => updateField('otherIncome', Number(value))}
            placeholder="Ej: 500"
            icon={<TrendingUp className="w-4 h-4" />}
            helpText="Ingresos adicionales: freelance, alquileres, etc."
          />
        </div>
      </div>

      {/* Gastos */}
      <div>
        <h3 className="text-lg font-semibold text-dark mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Gastos Mensuales
        </h3>
        <Input
          label="Gastos mensuales totales"
          type="number"
          value={form.monthlyExpenses || ''}
          onChange={(value) => updateField('monthlyExpenses', Number(value))}
          placeholder="Ej: 1500"
          icon={<CreditCard className="w-4 h-4" />}
          error={errors.monthlyExpenses}
          helpText="Incluye alimentación, transporte, servicios, etc."
          required
        />
      </div>

      {/* Deudas */}
      <div>
        <h3 className="text-lg font-semibold text-dark mb-4">¿Tienes deudas actualmente?</h3>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              updateField('hasDebts', true);
              if (form.debts.length === 0) addDebt();
            }}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              form.hasDebts
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Sí, tengo deudas
          </button>
          <button
            onClick={() => {
              updateField('hasDebts', false);
              updateField('debts', []);
            }}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              !form.hasDebts
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            No tengo deudas
          </button>
        </div>

        {form.hasDebts && (
          <div className="space-y-4">
            {form.debts.map((debt, idx) => (
              <Card key={debt.id} className="p-4 relative">
                <button
                  onClick={() => removeDebt(debt.id)}
                  className="absolute top-2 right-2 p-1 text-fondea-text hover:text-error transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-3">
                  <Input
                    label="Entidad"
                    value={debt.entity}
                    onChange={(value) => updateDebt(debt.id, 'entity', value)}
                    placeholder="Ej: Banco BCP"
                    error={errors[`debt_${idx}_entity`]}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Tipo de deuda
                      </label>
                      <select
                        value={debt.type}
                        onChange={(e) => updateDebt(debt.id, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="personal">Préstamo personal</option>
                        <option value="credit_card">Tarjeta de crédito</option>
                        <option value="mortgage">Hipotecario</option>
                        <option value="auto">Vehicular</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <Input
                      label="Monto total"
                      type="number"
                      value={debt.amount || ''}
                      onChange={(value) => updateDebt(debt.id, 'amount', Number(value))}
                      placeholder="5000"
                      error={errors[`debt_${idx}_amount`]}
                    />
                  </div>
                  <Input
                    label="Cuota mensual"
                    type="number"
                    value={debt.monthlyPayment || ''}
                    onChange={(value) => updateDebt(debt.id, 'monthlyPayment', Number(value))}
                    placeholder="500"
                    error={errors[`debt_${idx}_payment`]}
                  />
                </div>
              </Card>
            ))}
            {errors.debts && (
              <p className="text-sm text-error">{errors.debts}</p>
            )}
            <button
              onClick={addDebt}
              className="w-full px-4 py-3 border-2 border-dashed border-border hover:border-primary text-primary rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar otra deuda
            </button>
          </div>
        )}
      </div>

      {/* Ahorros */}
      <div>
        <h3 className="text-lg font-semibold text-dark mb-4">¿Tienes ahorros?</h3>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => updateField('hasSavings', true)}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              form.hasSavings
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Sí, tengo ahorros
          </button>
          <button
            onClick={() => {
              updateField('hasSavings', false);
              updateField('savingsAmount', 0);
            }}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              !form.hasSavings
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            No tengo ahorros
          </button>
        </div>

        {form.hasSavings && (
          <Input
            label="Monto aproximado de ahorros"
            type="number"
            value={form.savingsAmount || ''}
            onChange={(value) => updateField('savingsAmount', Number(value))}
            placeholder="Ej: 2000"
            icon={<DollarSign className="w-4 h-4" />}
            error={errors.savingsAmount}
          />
        )}
      </div>

      {errors.submit && (
        <div className="p-4 bg-error/10 border border-error rounded-lg">
          <p className="text-sm text-error">{errors.submit}</p>
        </div>
      )}

      {!dashboardMode && (
        <Button
          onClick={handleSubmit}
          loading={loading}
          className="w-full"
          size="lg"
        >
          Continuar →
        </Button>
      )}
    </div>
  );

  if (dashboardMode) {
    return (
      <>
        {content}
        <StickyBottomBar
          ctaLabel="Guardar y volver al dashboard"
          onCta={handleSubmit}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Perfil Económico
        </h1>
        <p className="text-fondea-text">
          Necesitamos conocer tu situación financiera para calcular tu capacidad de pago.
        </p>
      </div>
      <Card>{content}</Card>
    </div>
  );
}
