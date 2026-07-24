'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, FileText, CreditCard, Camera, FileCheck, Brain, Database } from 'lucide-react';
import Link from 'next/link';
import { ApplicationCoreSection } from './detail/ApplicationCoreSection';
import { ApplicationDetailSection } from './detail/ApplicationDetailSection';
import { ApplicationDocumentsSection } from './detail/ApplicationDocumentsSection';
import { ApplicationContractSection } from './detail/ApplicationContractSection';
import { ApplicationEvaluationSection } from './detail/ApplicationEvaluationSection';
import { ApplicationSnapshotsSection } from './detail/ApplicationSnapshotsSection';
import type {
  AdminApplicationCore,
  AdminApplicationDetail,
  AdminApplicationDocuments,
  AdminApplicationContract,
  AdminApplicationEvaluation,
} from '@/modules/admin/admin-application-detail.service';

interface ApplicationDetailClientProps {
  core: AdminApplicationCore;
  detail: AdminApplicationDetail | null;
  documents: AdminApplicationDocuments | null;
  contract: AdminApplicationContract | null;
  evaluation: AdminApplicationEvaluation | null;
}

export function ApplicationDetailClient({
  core,
  detail,
  documents,
  contract,
  evaluation,
}: ApplicationDetailClientProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Back link */}
      <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Solicitudes
      </Link>

      {/* Core header (siempre visible) */}
      <ApplicationCoreSection data={core} />

      {/* Tabs para el resto */}
      <Tabs defaultValue="detail">
        <TabsList>
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
        </TabsList>

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
