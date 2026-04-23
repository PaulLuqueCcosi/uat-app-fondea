'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { StickyBottomBar } from '@/app/components/ui/StickyBottomBar';
import { Users, Plus, X, Phone, User as UserIcon } from 'lucide-react';
import { saveReferences } from '@/app/actions/loan.actions';
import type { ReferencesData, Reference } from '@/lib/types';

interface FunnelReferencesProps {
  dashboardMode?: boolean;
}

export function FunnelReferences({ dashboardMode }: FunnelReferencesProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ReferencesData>({
    references: [
      { id: '1', name: '', phone: '', relationship: 'family' },
      { id: '2', name: '', phone: '', relationship: 'friend' },
    ],
  });

  const updateReference = (id: string, field: keyof Reference, value: any) => {
    const updated = form.references.map(ref =>
      ref.id === id ? { ...ref, [field]: value } : ref
    );
    setForm({ references: updated });

    // Clear error for this field
    const errorKey = `ref_${id}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  const addReference = () => {
    const newRef: Reference = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      relationship: 'other',
    };
    setForm({ references: [...form.references, newRef] });
  };

  const removeReference = (id: string) => {
    if (form.references.length <= 2) {
      setErrors({ min: 'Debes tener al menos 2 referencias' });
      return;
    }
    setForm({ references: form.references.filter(r => r.id !== id) });
    if (errors.min) {
      const next = { ...errors };
      delete next.min;
      setErrors(next);
    }
  };

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (form.references.length < 2) {
      newErrors.min = 'Debes agregar al menos 2 referencias';
    }

    form.references.forEach(ref => {
      if (!ref.name.trim()) {
        newErrors[`ref_${ref.id}_name`] = 'El nombre es requerido';
      }
      if (ref.name.trim().length < 3) {
        newErrors[`ref_${ref.id}_name`] = 'El nombre debe tener al menos 3 caracteres';
      }
      if (!ref.phone.trim()) {
        newErrors[`ref_${ref.id}_phone`] = 'El teléfono es requerido';
      }
      if (!/^9\d{8}$/.test(ref.phone.trim())) {
        newErrors[`ref_${ref.id}_phone`] = 'Ingresa un número válido (9 dígitos, comienza con 9)';
      }
    });

    // Check for duplicate phones
    const phones = form.references.map(r => r.phone.trim()).filter(Boolean);
    const duplicates = phones.filter((phone, index) => phones.indexOf(phone) !== index);
    if (duplicates.length > 0) {
      form.references.forEach(ref => {
        if (duplicates.includes(ref.phone.trim())) {
          newErrors[`ref_${ref.id}_phone`] = 'Este teléfono ya fue ingresado';
        }
      });
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await saveReferences(form);
      if (dashboardMode) {
        router.push('/dashboard');
      } else {
        router.push('/funnel/additional');
      }
    } catch (error) {
      console.error('Error saving references:', error);
      setErrors({ submit: 'Error al guardar. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-dark">
          <strong>¿Por qué pedimos referencias?</strong> Las referencias nos ayudan a conocerte mejor
          y pueden ser contactadas para verificar información en caso sea necesario.
        </p>
      </div>

      {errors.min && (
        <div className="p-4 bg-error/10 border border-error rounded-lg">
          <p className="text-sm text-error">{errors.min}</p>
        </div>
      )}

      <div className="space-y-4">
        {form.references.map((ref, idx) => (
          <Card key={ref.id} className="p-4 relative">
            {form.references.length > 2 && (
              <button
                onClick={() => removeReference(ref.id)}
                className="absolute top-2 right-2 p-1 text-fondea-text hover:text-error transition-colors"
                title="Eliminar referencia"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-dark">Referencia {idx + 1}</h3>
            </div>

            <div className="space-y-3">
              <Input
                label="Nombre completo"
                value={ref.name}
                onChange={(value) => updateReference(ref.id, 'name', value)}
                placeholder="Ej: Juan Pérez García"
                icon={<UserIcon className="w-4 h-4" />}
                error={errors[`ref_${ref.id}_name`]}
                required
              />

              <Input
                label="Teléfono celular"
                type="tel"
                value={ref.phone}
                onChange={(value) => {
                  const cleaned = value.replace(/\D/g, '');
                  updateReference(ref.id, 'phone', cleaned);
                }}
                placeholder="987654321"
                icon={<Phone className="w-4 h-4" />}
                error={errors[`ref_${ref.id}_phone`]}
                maxLength={9}
                required
              />

              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Relación <span className="text-error">*</span>
                </label>
                <select
                  value={ref.relationship}
                  onChange={(e) => updateReference(ref.id, 'relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="family">Familiar</option>
                  <option value="friend">Amigo(a)</option>
                  <option value="coworker">Compañero(a) de trabajo</option>
                  <option value="neighbor">Vecino(a)</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={addReference}
        className="w-full px-4 py-3 border-2 border-dashed border-border hover:border-primary text-primary rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar otra referencia
      </button>

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
          Referencias Personales
        </h1>
        <p className="text-fondea-text">
          Necesitamos al menos 2 referencias de personas que te conozcan.
        </p>
      </div>
      <Card>{content}</Card>
    </div>
  );
}
