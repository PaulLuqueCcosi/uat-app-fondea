import { Suspense } from 'react';
import { getModules } from '@/lib/education/get-modules';
import { PageTitle } from '@/components/ui/page-title';
import { EducationGrid } from '@/components/dashboard/education/EducationGrid';
import { EducationGridSkeleton } from '@/components/dashboard/education/EducationGridSkeleton';

export const dynamic = 'force-dynamic';

async function EducationModulesLoader() {
  const modules = await getModules();
  return <EducationGrid modules={modules} />;
}

export default function EducacionPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Fondea Aprende"
        description="Educación financiera práctica para tomar mejores decisiones con tu dinero."
      />

      <Suspense fallback={<EducationGridSkeleton />}>
        <EducationModulesLoader />
      </Suspense>
    </div>
  );
}
