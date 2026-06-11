import { Suspense } from 'react';
import { DashboardHomeClient } from '@/components/dashboard/DashboardHomeClient';
import { Header } from '@/components/dashboard/sections/Header';
import { ProgressBar } from '@/components/dashboard/sections/ProgressBar';
import { Applications } from '@/components/dashboard/sections/Applications';
import { NudgeAlert } from '@/components/dashboard/sections/NudgeAlert';
import { ActiveLoanCardServer } from '@/components/dashboard/sections/ActiveLoanCardServer';
import { FinancialPassport } from '@/components/dashboard/sections/FinancialPassport';
import { CreditScore } from '@/components/dashboard/sections/CreditScore';
import { EducationCarousel } from '@/components/dashboard/sections/EducationCarousel';
import { TransparencyCard } from '@/components/dashboard/sections/TransparencyCard';
import { ReferralProgram } from '@/components/dashboard/sections/ReferralProgram';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <DashboardHomeClient>
        {/* 1. Cabecera y Bienvenida */}
        <Suspense fallback={<Header.Skeleton />}>
          <Header />
        </Suspense>

        {/* 2. Alerta Estratégica (Nudge) */}
        <NudgeAlert />

        {/* 3. Tu Préstamo Actual — El Núcleo (ancho completo, destaca) */}
        <ActiveLoanCardServer />

        {/* 4. Pasaporte Financiero + Score + Referidos — fila ancho completo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FinancialPassport />
          <CreditScore />
          <ReferralProgram />
        </div>

        {/* Layout 2 columnas: izq principal / der secundario */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 6. Fondea Aprende — Carrusel horizontal */}
            <EducationCarousel />

            {/* 7. Transparencia FONDEA */}
            <TransparencyCard />
          </div>

          {/* Columna derecha (1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
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
  );
}
