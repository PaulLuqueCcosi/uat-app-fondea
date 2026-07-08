import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, FileText, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { getAdminUserDetail, getAdminUserForms, getAdminBankAccountFullData } from '@/modules/admin';
import { mockUserDetail, mockApplications } from '@/modules/admin';
import type { FormExpediente, BankAccountFullData } from '@/modules/admin';
import { FormStatusCard } from '@/components/admin/users/FormStatusCard';
import { FormLockCard } from '@/components/admin/users/FormLockCard';
import { AdminFormDataView } from '@/components/admin/users/AdminFormDataView';
import { FormSubmissionsHistory } from '@/components/admin/users/FormSubmissionsHistory';
import { ScoreTab } from '@/components/admin/users/ScoreTab';
import { PuntajeTab } from '@/components/admin/users/PuntajeTab';
import { UserApplicationsTab } from '@/components/admin/users/UserApplicationsTab';
import { UserReferralsTab } from '@/components/admin/users/UserReferralsTab';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Datos reales del backend
  const [user, forms, bankFullData] = await Promise.all([
    getAdminUserDetail(id),
    getAdminUserForms(id),
    getAdminBankAccountFullData(id),
  ]);

  // Fallback si el usuario no existe
  const displayUser = user || { id, name: '(Usuario no encontrado)', documentType: null, documentNumber: null, registeredAt: '' };

  // TODO: Estos tabs aún usan mock — conectar cuando el backend tenga endpoints
  const detail = mockUserDetail;

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
              {displayUser.documentType && <><span className="font-mono">{displayUser.documentType}: {displayUser.documentNumber}</span> · </>}
              ID: <span className="font-mono text-xs">{displayUser.id}</span>
            </p>
          </div>
        </div>
        {displayUser.registeredAt && (
          <p className="text-xs text-muted-foreground">
            Registro: {new Date(displayUser.registeredAt).toLocaleDateString('es-PE')}
          </p>
        )}
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

        {/* ═══ EXPEDIENTES (datos reales) ═══ */}
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
                  <FormDetailPanel formKey={key} form={form as FormExpediente} userId={id} bankFullData={key === 'bankAccount' ? bankFullData : null} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-sm text-muted-foreground">Este usuario no tiene expedientes registrados.</p>
          )}
        </TabsContent>

        {/* ═══ SCORE (mock — TODO: conectar al backend) ═══ */}
        <TabsContent value="score" className="mt-6">
          <ScoreTab score={detail.score} />
        </TabsContent>

        {/* ═══ PUNTAJE (mock — TODO: conectar al backend) ═══ */}
        <TabsContent value="puntaje" className="mt-6">
          <PuntajeTab gamification={detail.gamification} />
        </TabsContent>

        {/* ═══ SOLICITUDES (mock — TODO: conectar al backend) ═══ */}
        <TabsContent value="solicitudes" className="mt-6">
          <UserApplicationsTab
            applications={mockApplications.filter((a) => a.userId === id)}
          />
        </TabsContent>

        {/* ═══ REFERIDOS (mock — TODO: conectar al backend) ═══ */}
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

function FormDetailPanel({ formKey, form, userId, bankFullData }: { formKey: string; form: FormExpediente; userId: string; bankFullData?: BankAccountFullData | null }) {
  const lastApproved = form.submissions.find((s) => s.verificationResult === 'APPROVED') ?? null;

  // Para bank account, si tenemos datos completos del backend, usarlos
  const dataToShow = formKey === 'bankAccount' && bankFullData
    ? { bank_name: bankFullData.bankName, account_type: bankFullData.accountType, cci: bankFullData.cci, account_number: bankFullData.accountNumber }
    : lastApproved?.submissionData ?? {};

  return (
    <div className="space-y-6">
      {/* Estado + Lock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormStatusCard form={form} />
        <FormLockCard lock={form.lock} userId={userId} formType={formKey} />
      </div>

      {/* Datos actuales */}
      <AdminFormDataView formKey={formKey} data={dataToShow} />

      {/* Historial de envíos */}
      <FormSubmissionsHistory submissions={form.submissions} formKey={formKey} />
    </div>
  );
}
