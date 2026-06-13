import { Suspense } from 'react';
import { getModules } from '@/modules/education';
import { PageTitle } from '@/components/ui/page-title';
import { EducationGrid } from '@/components/education/EducationGrid';
import { EducationGridSkeleton } from '@/components/education/EducationGridSkeleton';
import { EducationErrorRouter } from '@/components/education/EducationErrorStates';

export const dynamic = 'force-dynamic';

async function EducationModulesLoader() {
  const result = await getModules();
  
  if (!result.ok) {
    return <EducationErrorRouter error={result.error} />;
  }
  
  return <EducationGrid modules={result.data} />;
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
