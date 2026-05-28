/**
 * ⚠️ TEMPORAL — BORRAR DESPUÉS DE PROBAR ⚠️
 *
 * Página de Lambda Tester para probar la Lambda de business-validation.
 */

import { PageHeader } from '@/components/ui/page-header';
import { LambdaTesterClient } from './LambdaTesterClient';

export const dynamic = 'force-dynamic';

export default function LambdaTesterPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Dev Tools', href: '/dashboard/dev-tools' },
          { label: 'Lambda Tester' },
        ]}
      />
      <div className="p-4">
        <LambdaTesterClient />
      </div>
    </>
  );
}
