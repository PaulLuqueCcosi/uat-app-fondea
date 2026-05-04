import { getActiveIntencion } from '@/app/actions/intencion.actions';
import LoanCalculator from '@/components/calculadora/LoanCalculator';
import type { InitialValues } from '@/components/calculadora/LoanCalculator';

/**
 * Calculadora de préstamos interna.
 *
 * - Si el usuario tiene una intención ACTIVE → la calculadora se pre-llena
 *   con sus datos y el submit hace PUT /api/v1/intentions/{id} (editar).
 * - Si no tiene ninguna → valores por defecto y el submit hace
 *   POST /api/v1/intentions (crear nueva).
 *
 * En ambos casos, tras el submit redirige a /solicitar/start.
 */
export default async function CalculadoraPage() {
  const intencion = await getActiveIntencion();

  const initialValues: InitialValues | undefined = intencion
    ? {
        intencionId:      intencion.intencionId,
        amount:           intencion.amount,
        termDays:         intencion.termDays,
        installmentCount: intencion.installmentCount,
      }
    : undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
            {intencion ? 'Modifica tu préstamo' : 'Calculadora de préstamo'}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            {intencion
              ? 'Ajusta el monto o plazo y guarda los cambios.'
              : 'Elige el monto y plazo que mejor se adapte a ti.'}
          </p>
        </div>
        <div className="flex justify-center">
          <LoanCalculator initialValues={initialValues} />
        </div>
      </div>
    </div>
  );
}
