import { redirect } from 'next/navigation';
import { getApplicationDetailAction, getApplicationStatusAction, getApplicationsAction } from '@/app/actions/application.actions';
import { ApplicationStatusView } from '@/components/solicitudes/ApplicationStatusView';
import type { ApplicationStatus, EvaluationResult } from '@/lib/types';

export default async function SolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  // El layout raíz ya garantiza sesión activa.

  // Next.js 15: params es una Promise
  const { id } = await params;
  console.log('[SOLICITUD PAGE] ID:', id);

  // Intentar obtener el detalle completo primero
  let application = await getApplicationDetailAction(id);
  console.log('[SOLICITUD PAGE] Application detail:', application);

  // Si falla, intentar con el endpoint de status y luego buscar en la lista
  if (!application) {
    console.log('[SOLICITUD PAGE] Detalle no disponible, intentando con status...');
    const statusData = await getApplicationStatusAction(id);
    console.log('[SOLICITUD PAGE] Status data:', statusData);

    if (!statusData) {
      console.log('[SOLICITUD PAGE] Status tampoco disponible, verificando en lista...');
      // Como último recurso, buscar en la lista de aplicaciones
      const applicationsData = await getApplicationsAction();
      const foundApp = applicationsData?.applications.find(app => app.id === id);

      if (!foundApp) {
        console.log('[SOLICITUD PAGE] No se encontró en ningún lado, redirigiendo a dashboard');
        redirect('/dashboard');
      }

      application = foundApp;
    } else {
      // Construir ApplicationRecord desde el status
      application = {
        id: id,
        userId: '', // No lo necesitamos para mostrar
        status: statusData.status as ApplicationStatus,
        result: statusData.result as EvaluationResult | undefined,
        submittedAt: new Date().toISOString(), // Placeholder
        evaluatedAt: undefined,
        canRetryAt: statusData.canRetryAt ?? undefined,
      };
    }
  }

  // Redirigir según el estado de la aplicación
  if (!application) {
    redirect('/dashboard');
  }

  const status = application.status.toUpperCase();
  console.log('[SOLICITUD PAGE] Status final:', status);

  // Estados no terminales - aún en evaluación
  if (['SUBMITTED', 'EVALUATING'].includes(status)) {
    console.log('[SOLICITUD PAGE] Estado en evaluación, redirigiendo a /evaluando');
    redirect(`/solicitudes/${id}/evaluando`);
  }

  // Estado requiere más información
  if (status === 'MORE_INFO') {
    console.log('[SOLICITUD PAGE] Requiere más info, redirigiendo a /mas-info');
    redirect(`/solicitudes/${id}/mas-info`);
  }

  // Si llegó aquí, es un estado terminal (APPROVED o REJECTED)
  console.log('[SOLICITUD PAGE] Estado terminal, mostrando vista');
  // Mostrar la vista de estado
  return <ApplicationStatusView application={application} />;
}
