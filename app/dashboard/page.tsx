import { Suspense } from 'react';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { HeaderWithContext } from '@/components/dashboard/sections/HeaderWithContext';
import { ProgressBar } from '@/components/dashboard/sections/ProgressBar';
import { Applications } from '@/components/dashboard/sections/Applications';
import { ActiveLoanCardServer } from '@/components/dashboard/sections/ActiveLoanCardServer';
import { FinancialPassport } from '@/components/dashboard/sections/FinancialPassport';
import { DashboardCalculator } from '@/components/dashboard/sections/DashboardCalculator';
import { CreditScore } from '@/components/dashboard/sections/CreditScore';
import { EducationCarousel } from '@/components/dashboard/sections/EducationCarousel';
import { TransparencyCard } from '@/components/dashboard/sections/TransparencyCard';
import { ReferralProgramSection } from '@/components/dashboard/sections/ReferralProgramServer';
import { getModuleSummaries } from '@/modules/education';
import { NpsSurveyPrompt } from '@/components/nps/NpsSurveyPrompt';

export default async function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <DashboardHomeClient>
        {/* 1. Cabecera y Bienvenida */}
        <HeaderWithContext />

        {/* 3. Tu Préstamo Actual — El Núcleo (ancho completo, destaca) */}
        <Suspense fallback={null}>
          <ActiveLoanCardServer />
        </Suspense>

        {/* 4. Pasaporte Financiero (izq) + Calculadora (der) — 50/50 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinancialPassport />
          <DashboardCalculator />
        </div>

        {/* 5. Layout 2 columnas: principal (2/3) + lateral (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Fila 1: Score + Referidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CreditScore />
              <Suspense fallback={<ReferralProgramSection.Skeleton />}>
                <ReferralProgramSection />
              </Suspense>
            </div>

            {/* Fila 2: Fondea Aprende */}
            <Suspense fallback={null}>
              <EducationCarouselServer />
            </Suspense>

            {/* Fila 3: Transparencia */}
            <TransparencyCard />
          </div>

          {/* Columna derecha (1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Fila 1: Expedientes */}
            <Suspense fallback={<ProgressBar.Skeleton />}>
              <ProgressBar />
            </Suspense>

            {/* Fila 2: Últimas solicitudes */}
            <Suspense fallback={<Applications.Skeleton />}>
              <Applications />
            </Suspense>
          </div>
        </div>
      </DashboardHomeClient>

      {/* Encuesta NPS flotante */}
      <NpsSurveyPrompt />
    </div>
  );
}

/** Server component que carga educación de forma asíncrona */
async function EducationCarouselServer() {
  const educationResult = await getModuleSummaries();
  const educationModules = educationResult.ok ? educationResult.data : [];
  return <EducationCarousel modules={educationModules} />;
}
