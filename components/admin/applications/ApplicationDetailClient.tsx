'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, LayoutDashboard, CreditCard, Camera, FileCheck, Brain, Database, History } from 'lucide-react';
import Link from 'next/link';
import { ApplicationDetailHeader } from './detail/ApplicationDetailHeader';
import { ApplicationOverviewTab } from './detail/ApplicationOverviewTab';
import { ApplicationDetailSection } from './detail/ApplicationDetailSection';
import { ApplicationDocumentsSection } from './detail/ApplicationDocumentsSection';
import { ApplicationContractSection } from './detail/ApplicationContractSection';
import { ApplicationEvaluationSection } from './detail/ApplicationEvaluationSection';
import { ApplicationSnapshotsSection } from './detail/ApplicationSnapshotsSection';
import { ApplicationTimelineSection } from './detail/ApplicationTimelineSection';
import type {
  AdminApplicationCore,
  AdminApplicationDetail,
  AdminApplicationDocuments,
  AdminApplicationContract,
  AdminApplicationEvaluation,
  AuditTimelineEntry,
} from '@/modules/admin/admin-application-detail.service';

interface CoreDates {
  submittedAt: string;
  evaluatedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  canRetryAt: string;
}

interface ApplicationDetailClientProps {
  core: AdminApplicationCore;
  coreDates: CoreDates;
  detail: AdminApplicationDetail | null;
  documents: AdminApplicationDocuments | null;
  contract: AdminApplicationContract | null;
  evaluation: AdminApplicationEvaluation | null;
  timeline: AuditTimelineEntry[] | null;
}

export function ApplicationDetailClient({
  core,
  coreDates,
  detail,
  documents,
  contract,
  evaluation,
  timeline,
}: ApplicationDetailClientProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Back link */}
      <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Solicitudes
      </Link>

      {/* Header angosto (siempre visible) */}
      <ApplicationDetailHeader data={core} />

      {/* Tabs para el resto */}
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="detail">
            <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Financiero
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Camera className="h-3.5 w-3.5 mr-1.5" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="contract">
            <FileCheck className="h-3.5 w-3.5 mr-1.5" /> Contrato
          </TabsTrigger>
          <TabsTrigger value="evaluation">
            <Brain className="h-3.5 w-3.5 mr-1.5" /> Evaluación
          </TabsTrigger>
          <TabsTrigger value="snapshots">
            <Database className="h-3.5 w-3.5 mr-1.5" /> Snapshots
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <History className="h-3.5 w-3.5 mr-1.5" /> Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ApplicationOverviewTab data={core} dates={coreDates} />
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          {detail ? (
            <ApplicationDetailSection data={detail} />
          ) : (
            <EmptyTabState message="No hay detalle financiero para esta solicitud" />
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {documents ? (
            <ApplicationDocumentsSection data={documents} />
          ) : (
            <EmptyTabState message="No hay datos de documentos" />
          )}
        </TabsContent>

        <TabsContent value="contract" className="mt-4">
          {contract ? (
            <ApplicationContractSection data={contract} />
          ) : (
            <EmptyTabState message="No hay datos de contrato" />
          )}
        </TabsContent>

        <TabsContent value="evaluation" className="mt-4">
          {evaluation ? (
            <ApplicationEvaluationSection data={evaluation} />
          ) : (
            <EmptyTabState message="No hay datos de evaluación" />
          )}
        </TabsContent>

        <TabsContent value="snapshots" className="mt-4">
          <ApplicationSnapshotsSection data={core} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          {timeline && timeline.length > 0 ? (
            <ApplicationTimelineSection entries={timeline} />
          ) : (
            <EmptyTabState message="No hay eventos de auditoría registrados para esta solicitud" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyTabState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
