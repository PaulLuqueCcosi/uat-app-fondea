'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { CircleDollarSign, FileText, Bell, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PenaltyConfigCard } from './PenaltyConfigCard';
import { FormEditPoliciesCard } from './FormEditPoliciesCard';
import { PassportRangesCard } from './PassportRangesCard';
import { DepositAccountCard } from './DepositAccountCard';
import { AvailabilityCard } from './AvailabilityCard';
import { NotificationRecipientsCard } from './NotificationRecipientsCard';
import { getAllFormConfigsAction, updateFormConfigAction } from '@/app/actions/admin-form-config.actions';
import type { AdminFormConfigResponse } from '@/modules/admin/admin-form-config.service';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MoraRange {
  label: string;
  minDays: number;
  maxDays: number | null;
  penaltyPerDay: number;
  type: 'PERCENTAGE' | 'FIXED';
  base: 'INSTALLMENT' | 'PRINCIPAL' | null;
}

interface NotificationConfig {
  paymentReminderDaysBefore: number;
  overdueReminderIntervalDays: number;
  maxRemindersBeforeEscalation: number;
}

interface SystemConfig {
  mora: MoraRange[];
  notifications: NotificationConfig;
}

// ── Default config ────────────────────────────────────────────────────────────

const defaultConfig: SystemConfig = {
  mora: [
    { label: '1 a 3 días', minDays: 1, maxDays: 3, penaltyPerDay: 5, type: 'FIXED', base: null },
    { label: '4 a 14 días', minDays: 4, maxDays: 14, penaltyPerDay: 7, type: 'FIXED', base: null },
    { label: '15+ días', minDays: 15, maxDays: null, penaltyPerDay: 10, type: 'FIXED', base: null },
  ],
  notifications: {
    paymentReminderDaysBefore: 1,
    overdueReminderIntervalDays: 3,
    maxRemindersBeforeEscalation: 5,
  },
};

// Los 6 módulos reales de forms/ que tienen config de intentos/bloqueo en el backend
// (ver AdminConfigController) — "bank-account" es el nombre real, no "bank".
const FORM_MODULES: { key: string; label: string }[] = [
  { key: 'kyc', label: 'KYC (Identidad)' },
  { key: 'labor', label: 'Datos Laborales' },
  { key: 'economic', label: 'Datos Económicos' },
  { key: 'references', label: 'Referencias' },
  { key: 'address', label: 'Dirección' },
  { key: 'bank-account', label: 'Cuenta Bancaria' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminSettingsClient() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═══ CUENTA DE DEPÓSITO (conectado al backend) ═══
          Primero porque sin esto el cliente no puede pagar ninguna cuota. */}
      <DepositAccountCard />

      {/* ═══ MORA (conectado al backend) ═══ */}
      <PenaltyConfigCard />

      {/* ═══ EDICIÓN DE EXPEDIENTE (conectado al backend) ═══ */}
      <FormEditPoliciesCard />

      {/* ═══ RANGOS DEL PASAPORTE (conectado al backend) ═══ */}
      <PassportRangesCard />

      {/* ═══ CIUDADES Y HORARIO ACTIVOS — M1 #58 (conectado al backend) ═══ */}
      <AvailabilityCard />

      {/* ═══ DESTINATARIOS DE ALERTAS (conectado al backend) ═══ */}
      <NotificationRecipientsCard />

      {/* ═══ INTENTOS DE FORMULARIOS (conectado al backend) ═══ */}
      <FormAttemptsCard />

      {/* ═══ NOTIFICACIONES ═══ */}
      <NotificationsCard config={config} onSave={(notifications) => setConfig((p) => ({ ...p, notifications }))} />
    </div>
  );
}

// ── Mora Card ─────────────────────────────────────────────────────────────────

function MoraCard({ config, onSave }: { config: SystemConfig; onSave: (v: MoraRange[]) => void }) {
  const [draft, setDraft] = useState<MoraRange[]>([]);

  function openDraft() {
    setDraft(config.mora.map((r) => ({ ...r })));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-warning-600" /> Penalidades por Mora
          </CardTitle>
          <Dialog>
            <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openDraft} />}>
              <Pencil className="h-3 w-3 mr-1" /> Editar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Penalidades por Mora</DialogTitle>
                <DialogDescription>Configura el cargo diario según el rango de días de atraso</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {draft.map((range, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-foreground w-28 shrink-0">{range.label}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-sm text-muted-foreground">S/</span>
                      <Input
                        type="number"
                        min={0}
                        value={range.penaltyPerDay}
                        onChange={(e) => {
                          const updated = [...draft];
                          updated[i] = { ...updated[i], penaltyPerDay: Number(e.target.value) };
                          setDraft(updated);
                        }}
                        className="h-9 w-20 font-mono"
                      />
                      <span className="text-sm text-muted-foreground">/día</span>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                <DialogClose render={<Button onClick={() => onSave(draft)} />}>Guardar cambios</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-xs">Cargo diario según días de atraso</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {config.mora.map((range) => (
          <div key={range.label} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-foreground">{range.label}</span>
            <Badge variant="outline" className="font-mono">S/ {range.penaltyPerDay}/día</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Form Attempts Card (conectado al backend: GET/PUT /api/v1/admin/config) ───

function FormAttemptsCard() {
  const [configs, setConfigs] = useState<AdminFormConfigResponse[]>([]);
  const [draft, setDraft] = useState<AdminFormConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getAllFormConfigsAction();
      setConfigs(data);
      setLoading(false);
    }
    load();
  }, []);

  function configFor(moduleKey: string): AdminFormConfigResponse {
    return (
      configs.find((c) => c.module === moduleKey) ?? {
        id: null,
        module: moduleKey,
        maxAttempts: 3,
        blockHours: 24,
        validDurationDays: 90,
        active: true,
        description: null,
        minAge: null,
        maxAge: null,
      }
    );
  }

  function openDraft() {
    setDraft(FORM_MODULES.map((m) => ({ ...configFor(m.key) })));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const results = await Promise.all(
        draft.map((form) =>
          updateFormConfigAction(form.module, {
            maxAttempts: form.maxAttempts,
            blockHours: form.blockHours,
            validDurationDays: form.validDurationDays,
            active: form.active,
          }),
        ),
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`No se pudo guardar ${failed.length} de ${draft.length} módulos`);
      } else {
        toast.success('Configuración de intentos actualizada');
      }

      // Recarga desde el backend en vez de confiar en el draft local — asegura que lo
      // que se muestra sea lo que efectivamente quedó persistido.
      const refreshed = await getAllFormConfigsAction();
      setConfigs(refreshed);
    } finally {
      setSaving(false);
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
            <FileText className="h-4 w-4 text-primary" /> Intentos de Formularios
          </CardTitle>
          <Dialog>
            <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openDraft} />}>
              <Pencil className="h-3 w-3 mr-1" /> Editar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Intentos de Formularios</DialogTitle>
                <DialogDescription>Configura intentos máximos y tiempo de bloqueo por formulario</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {draft.map((form, i) => (
                  <div key={form.module} className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {FORM_MODULES.find((m) => m.key === form.module)?.label ?? form.module}
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          value={form.maxAttempts}
                          onChange={(e) => {
                            const updated = [...draft];
                            updated[i] = { ...updated[i], maxAttempts: Number(e.target.value) };
                            setDraft(updated);
                          }}
                          className="h-9 w-16 font-mono"
                        />
                        <span className="text-xs text-muted-foreground">intentos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          value={form.blockHours}
                          onChange={(e) => {
                            const updated = [...draft];
                            updated[i] = { ...updated[i], blockHours: Number(e.target.value) };
                            setDraft(updated);
                          }}
                          className="h-9 w-16 font-mono"
                        />
                        <span className="text-xs text-muted-foreground">h bloqueo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" disabled={saving} />}>Cancelar</DialogClose>
                <DialogClose render={<Button onClick={handleSave} disabled={saving} />}>
                  {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                  Guardar cambios
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-xs">Intentos máximos antes de bloquear, y horas de bloqueo, por formulario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {FORM_MODULES.map((mod) => {
          const cfg = configFor(mod.key);
          return (
            <div key={mod.key} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">{mod.label}</span>
              <span className="text-xs text-muted-foreground">{cfg.maxAttempts} intentos · {cfg.blockHours}h bloqueo</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Notifications Card ────────────────────────────────────────────────────────

function NotificationsCard({ config, onSave }: { config: SystemConfig; onSave: (v: NotificationConfig) => void }) {
  const [draft, setDraft] = useState<NotificationConfig>({ paymentReminderDaysBefore: 0, overdueReminderIntervalDays: 0, maxRemindersBeforeEscalation: 0 });

  function openDraft() {
    setDraft({ ...config.notifications });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" /> Notificaciones Automáticas
          </CardTitle>
          <Dialog>
            <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openDraft} />}>
              <Pencil className="h-3 w-3 mr-1" /> Editar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Notificaciones</DialogTitle>
                <DialogDescription>Configura recordatorios de pago y escalación</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Recordatorio antes del vencimiento (días)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.paymentReminderDaysBefore}
                    onChange={(e) => setDraft({ ...draft, paymentReminderDaysBefore: Number(e.target.value) })}
                    className="h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Intervalo de recordatorio en mora (días)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.overdueReminderIntervalDays}
                    onChange={(e) => setDraft({ ...draft, overdueReminderIntervalDays: Number(e.target.value) })}
                    className="h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Máx. recordatorios antes de escalar</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.maxRemindersBeforeEscalation}
                    onChange={(e) => setDraft({ ...draft, maxRemindersBeforeEscalation: Number(e.target.value) })}
                    className="h-9 font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                <DialogClose render={<Button onClick={() => onSave(draft)} />}>Guardar cambios</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-xs">Configuración de recordatorios y alertas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-foreground">Recordatorio antes del vencimiento</span>
          <span className="text-sm font-medium">{config.notifications.paymentReminderDaysBefore} día</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-foreground">Intervalo recordatorio mora</span>
          <span className="text-sm font-medium">Cada {config.notifications.overdueReminderIntervalDays} días</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-foreground">Máx. recordatorios antes de escalar</span>
          <span className="text-sm font-medium">{config.notifications.maxRemindersBeforeEscalation}</span>
        </div>
      </CardContent>
    </Card>
  );
}
