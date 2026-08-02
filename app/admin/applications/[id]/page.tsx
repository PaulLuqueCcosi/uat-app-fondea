import { notFound } from 'next/navigation';
import {
  getAdminApplicationCore,
  getAdminApplicationDetail,
  getAdminApplicationDocuments,
  getAdminApplicationContract,
  getAdminApplicationEvaluation,
  getAdminApplicationTimeline,
} from '@/modules/admin/admin-application-detail.service';
import { ApplicationDetailClient } from '@/components/admin/applications/ApplicationDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminApplicationDetailPage({ params }: Props) {
  const { id } = await params;

  // Fetch todos los sub-módulos en paralelo
  const [core, detail, documents, contract, evaluation, timeline] = await Promise.all([
    getAdminApplicationCore(id),
    getAdminApplicationDetail(id),
    getAdminApplicationDocuments(id),
    getAdminApplicationContract(id),
    getAdminApplicationEvaluation(id),
    getAdminApplicationTimeline(id),
  ]);

  // Si no hay core, la solicitud no existe
  if (!core) {
    notFound();
  }

  return (
    <ApplicationDetailClient
      core={core}
      detail={detail}
      documents={documents}
      contract={contract}
      evaluation={evaluation}
      timeline={timeline}
    />
  );
}
