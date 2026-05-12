import { redirect } from 'next/navigation';
import { getApplicationDetailAction, getApplicationsAction } from '@/app/actions/application.actions';
import { SolicitudView } from '@/components/solicitudes/SolicitudView';

export default async function SolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Obtener datos iniciales de la solicitud
  let application = await getApplicationDetailAction(id);

  // Fallback: buscar en la lista
  if (!application) {
    const applicationsData = await getApplicationsAction();
    const foundApp = applicationsData?.applications.find(app => app.id === id);

    if (!foundApp) {
      redirect('/dashboard');
    }

    application = foundApp;
  }

  if (!application) {
    redirect('/dashboard');
  }

  return <SolicitudView initialApplication={application} />;
}
