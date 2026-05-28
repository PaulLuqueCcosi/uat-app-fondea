import { Suspense } from 'react';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { Header } from '@/components/dashboard/sections/Header';
import { ProgressBar } from '@/components/dashboard/sections/ProgressBar';
import { Expediente } from '@/components/dashboard/sections/Expediente';
import { Applications } from '@/components/dashboard/sections/Applications';
import { LoanSection } from '@/components/dashboard/sections/LoanSection';
import { EducationSection } from '@/components/dashboard/sections/EducationSection';
import { QuickSettings } from '@/components/dashboard/sections/QuickSettings';
import { PuntajeCard } from '@/components/dashboard/PuntajeCard';
import { CreditScoreCard } from '@/components/dashboard/CreditScoreCard';
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

      <div className="flex flex-1 flex-col gap-4 p-4">
        <DashboardHomeClient>
          {/* Header con Suspense */}
          <Suspense fallback={<Header.Skeleton />}>
            <Header />
          </Suspense>

          {/* Progress Bar con Suspense */}
          <Suspense fallback={<ProgressBar.Skeleton />}>
            <ProgressBar />
          </Suspense>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Left column */}
            <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
              {/* Expediente con Suspense */}
              <Suspense fallback={<Expediente.Skeleton />}>
                <Expediente />
              </Suspense>

              {/* Solicitudes con Suspense */}
              <Suspense fallback={<Applications.Skeleton />}>
                <Applications />
              </Suspense>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
              {/* Tu Préstamo — usa intencion-store internamente */}
              <LoanSection />

              {/* Score Card */}
              <PuntajeCard />

              {/* Credit Score Card */}
              <CreditScoreCard />

              {/* Educación Financiera con Suspense */}
              <Suspense fallback={<EducationSection.Skeleton />}>
                <EducationSection />
              </Suspense>

              {/* Configuración Rápida con Suspense */}
              <Suspense fallback={<QuickSettings.Skeleton />}>
                <QuickSettings />
              </Suspense>
            </div>
          </div>
        </DashboardHomeClient>
      </div>
    </>
  );
}
