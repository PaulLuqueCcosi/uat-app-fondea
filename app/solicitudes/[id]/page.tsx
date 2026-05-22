'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getApplicationDetailAction, getApplicationFullDetailAction } from '@/app/actions/application.actions';
import { SolicitudView } from '@/components/solicitudes/SolicitudView';
import { useSolicitudData } from '@/components/solicitudes/SolicitudContext';
import type { ApplicationRecord } from '@/lib/types';
import type { ApplicationFullDetail } from '@/app/actions/application.actions';

export default function SolicitudPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { application: cachedApp, fullDetail: cachedDetail, isReady, setData } = useSolicitudData();

  const [application, setApplication] = useState<ApplicationRecord | null>(cachedApp);
  const [fullDetail, setFullDetail] = useState<ApplicationFullDetail | null>(cachedDetail);
  const [loading, setLoading] = useState(!isReady);

  useEffect(() => {
    // Si ya tenemos datos en el contexto, usarlos
    if (isReady && cachedApp) {
      setApplication(cachedApp);
      setFullDetail(cachedDetail);
      setLoading(false);
      return;
    }

    // Si no, cargar del backend
    async function load() {
      const app = await getApplicationDetailAction(id);
      if (!app) {
        router.push('/dashboard');
        return;
      }

      const isPolling = app.status === 'SUBMITTED' || app.status === 'PROCESSING';
      const detail = isPolling ? null : await getApplicationFullDetailAction(id);

      setApplication(app);
      setFullDetail(detail);
      setData(app, detail);
      setLoading(false);
    }

    load();
  }, [id, isReady, cachedApp, cachedDetail, setData, router]);

  if (loading || !application) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <SolicitudView initialApplication={application} initialFullDetail={fullDetail} />;
}
