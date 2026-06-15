import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton para el PassportFlipBook mientras carga.
 * Simula el aspecto de un libro abierto con 2 páginas.
 */
export function PassportFlipBookSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex gap-1 rounded-xl overflow-hidden shadow-lg">
        {/* Página izquierda (portada) */}
        <Skeleton className="w-[200px] h-[270px] md:w-[280px] md:h-[380px] rounded-none" />
        {/* Página derecha */}
        <Skeleton className="w-[200px] h-[270px] md:w-[280px] md:h-[380px] rounded-none hidden md:block" />
      </div>
      {/* Controles */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-3 w-28 hidden sm:block" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}
