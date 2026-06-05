import { Suspense } from 'react';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { Header } from '@/components/dashboard/sections/Header';
import { ProgressBar } from '@/components/dashboard/sections/ProgressBar';
import { Applications } from '@/components/dashboard/sections/Applications';
import { LoanSection } from '@/components/dashboard/sections/LoanSection';
import { EducationSection } from '@/components/dashboard/sections/EducationSection';
import { PageHeader } from '@/components/ui/page-header';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <DashboardHomeClient>
          {/* Header: saludo + botones CTA */}
          <Suspense fallback={<Header.Skeleton />}>
            <Header />
          </Suspense>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Columna izquierda — Educación financiera */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <EducationSection />
            </div>

            {/* Columna derecha — Préstamo + Expediente + Solicitudes */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Tu Préstamo (compacto) */}
              <LoanSection />

              {/* Barra de progreso del expediente */}
              <Suspense fallback={<ProgressBar.Skeleton />}>
                <ProgressBar />
              </Suspense>

              {/* Últimas solicitudes */}
              <Suspense fallback={<Applications.Skeleton />}>
                <Applications />
              </Suspense>
            </div>
          </div>
        </DashboardHomeClient>
      </div>
    </>
  );
}
