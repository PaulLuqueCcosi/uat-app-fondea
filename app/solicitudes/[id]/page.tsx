import { redirect } from 'next/navigation';
import { getApplicationDetailAction, getApplicationFullDetailAction } from '@/app/actions/application.actions';
import { SolicitudView } from '@/components/solicitudes/SolicitudView';

export default async function SolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const application = await getApplicationDetailAction(id);

  if (!application) {
    redirect('/dashboard');
  }

  // Solo cargar el detalle completo si la solicitud ya no está en evaluación
  const isPolling = application.status === 'SUBMITTED' || application.status === 'PROCESSING';
  const fullDetail = isPolling ? null : await getApplicationFullDetailAction(id);

  return <SolicitudView initialApplication={application} initialFullDetail={fullDetail} />;
}
