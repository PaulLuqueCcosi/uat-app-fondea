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

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  // Fechas formateadas acá (server component) para pasarle strings al client
  // component — evita hydration mismatch por diferencias de ICU Node vs navegador.
  const coreDates = {
    submittedAt: formatDateTime(core.submittedAt),
    evaluatedAt: formatDateTime(core.evaluatedAt),
    expiresAt: formatDateTime(core.expiresAt),
    createdAt: formatDateTime(core.createdAt),
    updatedAt: formatDateTime(core.updatedAt),
    canRetryAt: formatDateTime(core.canRetryAt),
  };

  return (
    <ApplicationDetailClient
      core={core}
      coreDates={coreDates}
      detail={detail}
      documents={documents}
      contract={contract}
      evaluation={evaluation}
      timeline={timeline}
    />
  );
}
