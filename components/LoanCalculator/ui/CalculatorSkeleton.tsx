/**
 * Skeleton de carga del LoanCalculator
 * Replica la estructura visual real: monto, plazo, cuotas, cronograma, gauge, botón
 */

import { Skeleton } from "./Skeleton";
import { CARD_MAX_WIDTH } from "../core/constants";

export function CalculatorSkeleton() {
  return (
    <div
      className="rounded-2xl shadow-2xl w-full shrink-0 bg-white border border-neutral-200 p-4 sm:p-5 space-y-4"
      style={{ maxWidth: `${CARD_MAX_WIDTH}px` }}
    >
      {/* Monto: label + valor + slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Plazo: label + 3 botones */}
      <div>
        <Skeleton className="h-4 w-12 mb-2 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>

      {/* Cuotas: label + botones cuadrados */}
      <div>
        <Skeleton className="h-4 w-14 mb-2 rounded" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Cronograma: label + filas */}
      <div>
        <Skeleton className="h-4 w-24 mb-2 rounded" />
        <div className="space-y-1">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        </div>
      </div>

      {/* Gauge: label + área circular */}
      <div>
        <Skeleton className="h-4 w-44 mb-3 rounded" />
        <div className="flex justify-center">
          <Skeleton className="h-28 w-48 rounded-xl" />
        </div>
      </div>

      {/* Botón CTA */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Ver detalles */}
      <Skeleton className="h-3 w-20 mx-auto rounded" />
    </div>
  );
}
