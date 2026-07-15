'use client';

import { useState } from 'react';
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
import { CircleDollarSign, FileText, Shield, Bell, Pencil, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PenaltyConfigCard } from './PenaltyConfigCard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MoraRange {
  label: string;
  minDays: number;
  maxDays: number | null;
  penaltyPerDay: number;
  type: 'PERCENTAGE' | 'FIXED';
  base: 'INSTALLMENT' | 'PRINCIPAL' | null;
}

interface FormAttemptConfig {
  label: string;
  key: string;
  maxAttempts: number;
  blockHours: number;
}

interface ScoringConfig {
  minScoreApproval: number;
  autoApproveThreshold: number;
  autoRejectThreshold: number;
}

interface NotificationConfig {
  paymentReminderDaysBefore: number;
  overdueReminderIntervalDays: number;
  maxRemindersBeforeEscalation: number;
}

interface SystemConfig {
  mora: MoraRange[];
  formAttempts: FormAttemptConfig[];
  scoring: ScoringConfig;
  notifications: NotificationConfig;
}

// ── Default config ────────────────────────────────────────────────────────────

const defaultConfig: SystemConfig = {
  mora: [
    { label: '1 a 3 días', minDays: 1, maxDays: 3, penaltyPerDay: 5, type: 'FIXED', base: null },
    { label: '4 a 14 días', minDays: 4, maxDays: 14, penaltyPerDay: 7, type: 'FIXED', base: null },
    { label: '15+ días', minDays: 15, maxDays: null, penaltyPerDay: 10, type: 'FIXED', base: null },
  ],
  formAttempts: [
    { label: 'KYC (Identidad)', key: 'kyc', maxAttempts: 3, blockHours: 24 },
    { label: 'Selfie / Biométrico', key: 'selfie', maxAttempts: 3, blockHours: 24 },
    { label: 'Cuenta Bancaria', key: 'bank', maxAttempts: 3, blockHours: 24 },
    { label: 'Datos Laborales', key: 'labor', maxAttempts: 3, blockHours: 24 },
    { label: 'Datos Económicos', key: 'economic', maxAttempts: 3, blockHours: 24 },
    { label: 'Referencias', key: 'references', maxAttempts: 3, blockHours: 24 },
  ],
  scoring: {
    minScoreApproval: 600,
    autoApproveThreshold: 750,
    autoRejectThreshold: 350,
  },
  notifications: {
    paymentReminderDaysBefore: 1,
    overdueReminderIntervalDays: 3,
    maxRemindersBeforeEscalation: 5,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminSettingsClient() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═══ CAPITAL BASE ═══ */}
      <Link href="/admin/settings/capital" className="block">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Capital Base
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription className="text-xs">
              Capital total disponible para préstamos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">Moneda</span>
              <Badge variant="outline" className="font-mono">PEN</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">Ajuste manual</span>
              <span className="text-xs text-muted-foreground">Activo</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* ═══ MORA (conectado al backend) ═══ */}
      <PenaltyConfigCard />

      {/* ═══ INTENTOS DE FORMULARIOS ═══ */}
      <FormAttemptsCard config={config} onSave={(formAttempts) => setConfig((p) => ({ ...p, formAttempts }))} />

      {/* ═══ SCORING ═══ */}
      <ScoringCard config={config} onSave={(scoring) => setConfig((p) => ({ ...p, scoring }))} />

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

// ── Form Attempts Card ────────────────────────────────────────────────────────

function FormAttemptsCard({ config, onSave }: { config: SystemConfig; onSave: (v: FormAttemptConfig[]) => void }) {
  const [draft, setDraft] = useState<FormAttemptConfig[]>([]);

  function openDraft() {
    setDraft(config.formAttempts.map((f) => ({ ...f })));
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
                  <div key={form.key} className="space-y-1.5">
                    <Label className="text-sm font-medium">{form.label}</Label>
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
                <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                <DialogClose render={<Button onClick={() => onSave(draft)} />}>Guardar cambios</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-xs">3 intentos máximo, si falla se bloquea 24h</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {config.formAttempts.map((form) => (
          <div key={form.key} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-foreground">{form.label}</span>
            <span className="text-xs text-muted-foreground">{form.maxAttempts} intentos · {form.blockHours}h bloqueo</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Scoring Card ──────────────────────────────────────────────────────────────

function ScoringCard({ config, onSave }: { config: SystemConfig; onSave: (v: ScoringConfig) => void }) {
  const [draft, setDraft] = useState<ScoringConfig>({ minScoreApproval: 0, autoApproveThreshold: 0, autoRejectThreshold: 0 });

  function openDraft() {
    setDraft({ ...config.scoring });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-success-600" /> Reglas de Scoring
          </CardTitle>
          <Dialog>
            <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={openDraft} />}>
              <Pencil className="h-3 w-3 mr-1" /> Editar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Reglas de Scoring</DialogTitle>
                <DialogDescription>Configura los umbrales de aprobación y rechazo automático</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Score mínimo para aprobación</Label>
                  <Input
                    type="number"
                    value={draft.minScoreApproval}
                    onChange={(e) => setDraft({ ...draft, minScoreApproval: Number(e.target.value) })}
                    className="h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Auto-aprobación si score ≥</Label>
                  <Input
                    type="number"
                    value={draft.autoApproveThreshold}
                    onChange={(e) => setDraft({ ...draft, autoApproveThreshold: Number(e.target.value) })}
                    className="h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Auto-rechazo si score ≤</Label>
                  <Input
                    type="number"
                    value={draft.autoRejectThreshold}
                    onChange={(e) => setDraft({ ...draft, autoRejectThreshold: Number(e.target.value) })}
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
        <CardDescription className="text-xs">Umbrales de aprobación automática</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-foreground">Score mínimo aprobación</span>
          <Badge variant="success" className="font-mono">{config.scoring.minScoreApproval}</Badge>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-foreground">Auto-aprobación (≥)</span>
          <Badge variant="success" className="font-mono">{config.scoring.autoApproveThreshold}</Badge>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-foreground">Auto-rechazo (≤)</span>
          <Badge variant="error" className="font-mono">{config.scoring.autoRejectThreshold}</Badge>
        </div>
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
