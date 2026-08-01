'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Shield, Briefcase, DollarSign, MapPin, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { getConfigAction, saveConfigAction } from '@/app/actions/configuracion-generica.actions';
import type { LucideIcon } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type FormEditPoliciesConfig = Record<string, boolean>;

interface ModuleInfo {
  key: string;
  label: string;
  icon: LucideIcon;
}

const MODULES: ModuleInfo[] = [
  { key: 'kyc', label: 'Identidad (KYC)', icon: Shield },
  { key: 'labor', label: 'Perfil Laboral', icon: Briefcase },
  { key: 'economic', label: 'Perfil Económico', icon: DollarSign },
  { key: 'address', label: 'Dirección', icon: MapPin },
  { key: 'references', label: 'Referencias', icon: Users },
  { key: 'bank_account', label: 'Cuenta Bancaria', icon: Building2 },
];

const CONFIG_KEY = 'form-edit-policies';

const DEFAULT_CONFIG: FormEditPoliciesConfig = {
  kyc: true,
  labor: true,
  economic: true,
  address: true,
  bank_account: true,
  references: true,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FormEditPoliciesCard() {
  const [config, setConfig] = useState<FormEditPoliciesConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getConfigAction<FormEditPoliciesConfig>(CONFIG_KEY);
        if (data) setConfig(data);
      } catch {
        // Si falla, usa defaults — no es crítico
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleToggle(moduleKey: string, enabled: boolean) {
    const updated = { ...config, [moduleKey]: enabled };
    setConfig(updated);
    setSaving(moduleKey);

    try {
      await saveConfigAction(CONFIG_KEY, updated);
      toast.success(
        enabled
          ? `${MODULES.find((m) => m.key === moduleKey)?.label} ahora es editable`
          : `${MODULES.find((m) => m.key === moduleKey)?.label} bloqueado para edición`
      );
    } catch {
      // Revertir en caso de error
      setConfig((prev) => ({ ...prev, [moduleKey]: !enabled }));
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Edición de Expediente
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {Object.values(config).filter(Boolean).length}/{MODULES.length} editables
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Controla si el usuario puede editar cada sección después de verificarla
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const enabled = config[mod.key] ?? true;
          const isSaving = saving === mod.key;

          return (
            <div
              key={mod.key}
              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor={`edit-policy-${mod.key}`} className="text-sm cursor-pointer">
                  {mod.label}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                <Switch
                  id={`edit-policy-${mod.key}`}
                  checked={enabled}
                  onCheckedChange={(checked) => handleToggle(mod.key, checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
          );
        })}

        <p className="text-[11px] text-muted-foreground pt-2 border-t">
          Cuando está desactivado, el usuario no podrá editar esa sección del expediente aunque ya esté verificada.
          Se muestra en modo solo lectura sin botón de editar.
        </p>
      </CardContent>
    </Card>
  );
}
