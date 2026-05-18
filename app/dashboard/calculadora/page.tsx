import LoanCalculatorPortal from '@/components/LoanCalculator/LoanCalculatorPortal';
import { PageHeader } from '@/components/ui/page-header';

/**
 * Calculadora de préstamos — vive en el dashboard, fuera del funnel.
 *
 * Siempre crea una intención nueva (si ya había una ACTIVE, el backend
 * la pasa a REPLACED). Al confirmar redirige a /solicitar/start.
 */
export default function CalculadoraPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Calculadora' },
        ]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="max-w-[460px] mx-auto w-full">
          <div className="mb-4">
            <h1 className="text-lg font-bold text-neutral-900 mb-0.5">
              Simula tu préstamo
            </h1>
            <p className="text-[13px] text-neutral-500 leading-relaxed">
              Configura monto, plazo y cuotas. Compara costos según tu perfil y solicítalo cuando estés listo.
            </p>
          </div>

          {/* Calculadora del portal — crea intención y navega a /solicitar/start */}
          <LoanCalculatorPortal dedicated detailMode="sidebar" />
        </div>
      </div>
    </>
  );
}
