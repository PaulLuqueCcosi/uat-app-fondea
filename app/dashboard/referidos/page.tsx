import { PageTitle } from '@/components/ui/page-title';
import { ReferidosClient } from './ReferidosClient';

export const dynamic = 'force-dynamic';

export default function ReferidosPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Programa de Referidos"
        description="Invita amigos y gana puntos para tu Pasaporte Financiero."
      />
      <ReferidosClient />
    </div>
  );
}
