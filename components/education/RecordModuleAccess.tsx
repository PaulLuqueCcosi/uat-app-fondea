'use client';

import { useEffect, useRef } from 'react';
import { recordEducationModuleAccess } from '@/app/actions/education.actions';

/**
 * Dispara el registro de acceso al módulo, una vez, al montar. Va en un client component
 * SEPARADO (no en el fetch del detalle ni en el server component de la página) porque Next.js
 * prefetchea automáticamente las rutas de los <Link> que entran al viewport (EducationGrid /
 * EducationCarousel) — ese prefetch NO monta client components, así que un useEffect real solo
 * corre cuando el usuario navega de verdad. Si el registro viviera en el GET o en el render de
 * servidor, el prefetch por sí solo inflaría el KPI de acceso.
 */
export function RecordModuleAccess({ moduleId }: { moduleId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    recordEducationModuleAccess(moduleId).catch(() => {});
  }, [moduleId]);

  return null;
}
