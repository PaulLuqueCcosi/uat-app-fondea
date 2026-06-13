import { PageTitle } from '@/components/ui/page-title';
import { CalculadoraClient } from '@/components/dashboard/CalculadoraClient';

/**
 * Calculadora de préstamos — vive en el dashboard, fuera del funnel.
 *
 * Siempre crea una intención nueva (si ya había una ACTIVE, el backend
 * la pasa a REPLACED). Al confirmar redirige a /solicitar/start.
 */
export default function CalculadoraPage() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 bg-background">
      <PageTitle
        title="Simula tu préstamo"
        description="Configura monto, plazo y cuotas. Compara costos según tu perfil y solicítalo cuando estés listo."
      />

      {/* Client component — maneja detailMode responsivo */}
      <CalculadoraClient />
    </div>
  );
}
