/**
 * ContentSkeleton — Skeleton de contenido para loading states de sub-páginas.
 *
 * Se usa cuando el layout (navbar, sidebar) ya está visible y solo
 * falta cargar el contenido principal. Simula bloques de contenido.
 *
 * @example
 * // Dashboard: cards + lista
 * <ContentSkeleton variant="dashboard" />
 *
 * // Funnel: formulario con campos
 * <ContentSkeleton variant="form" />
 *
 * // Summary: resumen con secciones
 * <ContentSkeleton variant="summary" />
 */

import { Skeleton } from '@/components/ui/skeleton';

interface ContentSkeletonProps {
  /** Tipo de contenido a simular */
  variant?: 'dashboard' | 'form' | 'summary';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Saludo */}
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      {/* Lista */}
      <div className="space-y-3 mt-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="py-4">
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-8 space-y-6">
        {/* FormHeader: icono + título + descripción + línea */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>

        {/* Card con campos del formulario */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {/* Campo 1 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {/* Campo 2 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {/* Campo 3 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {/* Campo 4 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Botón de acción */}
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="py-4">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* FormHeader */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>

        {/* Secciones del resumen */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            {/* Título de sección */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-36" />
            </div>
            {/* Filas de datos */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        ))}

        {/* Botón de enviar */}
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ContentSkeleton({ variant = 'dashboard' }: ContentSkeletonProps) {
  if (variant === 'form') return <FormSkeleton />;
  if (variant === 'summary') return <SummarySkeleton />;
  return <DashboardSkeleton />;
}
