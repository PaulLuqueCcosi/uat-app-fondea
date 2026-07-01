import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, FileText, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { mockUsers, mockUserDetail, mockUserForms, mockApplications } from '@/modules/admin';
import type { FormExpediente } from '@/modules/admin';
import { FormStatusCard } from '@/components/admin/users/FormStatusCard';
import { FormLockCard } from '@/components/admin/users/FormLockCard';
import { FormCurrentDataCard } from '@/components/admin/users/FormCurrentDataCard';
import { FormSubmissionsHistory } from '@/components/admin/users/FormSubmissionsHistory';
import { ScoreTab } from '@/components/admin/users/ScoreTab';
import { PuntajeTab } from '@/components/admin/users/PuntajeTab';
import { UserApplicationsTab } from '@/components/admin/users/UserApplicationsTab';
import { UserReferralsTab } from '@/components/admin/users/UserReferralsTab';

const FORM_LABELS: Record<string, string> = {
  kyc: 'Identidad (KYC)',
  labor: 'Perfil Laboral',
  economic: 'Perfil Económico',
  references: 'Referencias',
  address: 'Dirección',
  bankAccount: 'Cuenta Bancaria',
};

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  VERIFIED: { label: 'Verificado', variant: 'success' },
  EXPIRED: { label: 'Expirado', variant: 'warning' },
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  BLOCKED: { label: 'Bloqueado', variant: 'error' },
  REPLACED: { label: 'Reemplazado', variant: 'secondary' },
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = mockUsers.find((u) => u.id === id);
  const forms = mockUserForms[id] || null;
  const detail = mockUserDetail;

  const displayUser = user || { id, name: detail.name, dni: detail.dni, email: detail.email, phone: detail.phone, registeredAt: detail.registeredAt };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Usuarios
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
            {displayUser.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{displayUser.name}</h1>
            <p className="text-sm text-muted-foreground">
              DNI: <span className="font-mono">{displayUser.dni}</span> · {displayUser.email} · {displayUser.phone}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Registro: {new Date(displayUser.registeredAt).toLocaleDateString('es-PE')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expedientes" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="expedientes" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Expedientes</TabsTrigger>
          <TabsTrigger value="score" className="gap-1.5 text-xs"><Shield className="h-3.5 w-3.5" /> Score</TabsTrigger>
          <TabsTrigger value="puntaje" className="gap-1.5 text-xs"><Award className="h-3.5 w-3.5" /> Puntaje</TabsTrigger>
          <TabsTrigger value="solicitudes" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Solicitudes</TabsTrigger>
          <TabsTrigger value="referidos" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Referidos</TabsTrigger>
        </TabsList>

        {/* ═══ EXPEDIENTES ═══ */}
        <TabsContent value="expedientes" className="mt-6">
          {forms ? (
            <Tabs defaultValue="kyc" className="w-full">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="kyc" className="text-xs">KYC</TabsTrigger>
                <TabsTrigger value="labor" className="text-xs">Laboral</TabsTrigger>
                <TabsTrigger value="economic" className="text-xs">Económico</TabsTrigger>
                <TabsTrigger value="references" className="text-xs">Referencias</TabsTrigger>
                <TabsTrigger value="address" className="text-xs">Dirección</TabsTrigger>
                <TabsTrigger value="bankAccount" className="text-xs">Banco</TabsTrigger>
              </TabsList>

              {Object.entries(forms).map(([key, form]) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <FormDetailPanel formKey={key} form={form as FormExpediente} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-sm text-muted-foreground">Este usuario no tiene expedientes registrados.</p>
          )}
        </TabsContent>

        {/* ═══ SCORE ═══ */}
        <TabsContent value="score" className="mt-6">
          <ScoreTab score={detail.score} />
        </TabsContent>

        {/* ═══ PUNTAJE ═══ */}
        {/* ═══ PUNTAJE ═══ */}
        <TabsContent value="puntaje" className="mt-6">
          <PuntajeTab gamification={detail.gamification} />
        </TabsContent>

        {/* ═══ SOLICITUDES ═══ */}
        <TabsContent value="solicitudes" className="mt-6">
          <UserApplicationsTab
            applications={mockApplications.filter((a) => a.userId === id)}
          />
        </TabsContent>

        {/* ═══ REFERIDOS ═══ */}
        <TabsContent value="referidos" className="mt-6">
          <UserReferralsTab
            code={detail.referrals.code}
            totalReferred={detail.referrals.totalReferred}
            pointsEarned={detail.referrals.pointsEarned}
            referrals={[
              { id: 'ref_001', referredUserId: 'usr_006', registeredAt: '2026-06-10T08:00:00Z', completedAt: '2026-06-25T10:00:00Z', status: 'LOAN_COMPLETED', pointsAwarded: 15 },
              { id: 'ref_002', referredUserId: 'usr_007', registeredAt: '2026-06-18T14:00:00Z', completedAt: null, status: 'ACTIVE', pointsAwarded: 0 },
              { id: 'ref_003', referredUserId: 'usr_008', registeredAt: '2026-06-28T09:00:00Z', completedAt: null, status: 'REGISTERED', pointsAwarded: 0 },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── FormDetailPanel — Vista detallada por formulario ──────────────────────────

function FormDetailPanel({ formKey, form }: { formKey: string; form: FormExpediente }) {
  const lastApproved = form.submissions.find((s) => s.verificationResult === 'APPROVED') ?? null;

  return (
    <div className="space-y-6">
      {/* Estado + Lock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormStatusCard form={form} />
        <FormLockCard lock={form.lock} />
      </div>

      {/* Datos actuales */}
      <FormCurrentDataCard submission={lastApproved} />

      {/* Historial de envíos */}
      <FormSubmissionsHistory submissions={form.submissions} />
    </div>
  );
}
