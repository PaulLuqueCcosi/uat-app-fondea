'use client';

/**
 * Inicializa el store de Zustand con el applicationId de la URL.
 * Se monta en el layout de /solicitudes/[id].
 */

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';

export function SolicitudStoreInit() {
  const params = useParams();
  const applicationId = params.id as string | undefined;
  const init = useSolicitudStore(s => s.init);

  useEffect(() => {
    if (applicationId) {
      init(applicationId);
    }
  }, [applicationId, init]);

  return null;
}
