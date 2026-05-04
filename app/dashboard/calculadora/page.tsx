import LoanCalculator from '@/components/calculadora/LoanCalculator';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Calculadora de préstamos — vive en el dashboard, fuera del funnel.
 *
 * Siempre crea una intención nueva (si ya había una ACTIVE, el backend
 * la pasa a REPLACED). Al confirmar redirige a /solicitar/start.
 */
export default function CalculadoraPage() {
  return (
    <div className="max-w-[460px] mx-auto py-4 sm:py-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary-600 transition-colors group mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        Dashboard
      </Link>

      {/* Título pegado a la calculadora */}
      <div className="mb-4">
        <h1 className="text-lg font-bold text-neutral-900 mb-0.5">
          Simula tu préstamo
        </h1>
        <p className="text-[13px] text-neutral-500 leading-relaxed">
          Configura monto, plazo y cuotas. Compara costos según tu perfil y solicítalo cuando estés listo.
        </p>
      </div>

      {/* Calculadora — ya tiene su propia card con sombra y bordes */}
      <LoanCalculator flexibleWidth />
    </div>
  );
}
