import { getAdminUserPuntaje, getAdminUserPuntajeHistorial, getPuntajeRangos } from '@/modules/admin';
import { PuntajeTab } from '@/components/admin/users/PuntajeTab';

export default async function AdminUserPuntajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [score, historial, rangos] = await Promise.all([
    getAdminUserPuntaje(id),
    getAdminUserPuntajeHistorial(id, 0, 50),
    getPuntajeRangos(),
  ]);

  // Fecha formateada acá (server component) para pasarle strings al client component —
  // evita hydration mismatch por diferencias de ICU Node vs navegador.
  const history = historial.content.map((h) => ({
    ...h,
    createdAt: new Date(h.createdAt).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  return <PuntajeTab score={score} history={history} ranges={rangos} />;
}
