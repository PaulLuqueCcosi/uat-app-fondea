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
 */

interface ContentSkeletonProps {
  /** Tipo de contenido a simular */
  variant?: 'dashboard' | 'form';
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-neutral-200 animate-pulse ${className ?? ''}`} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Saludo */}
      <SkeletonBlock className="h-7 w-48" />
      <SkeletonBlock className="h-4 w-72" />

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <SkeletonBlock className="h-28 rounded-xl" />
        <SkeletonBlock className="h-28 rounded-xl" />
        <SkeletonBlock className="h-28 rounded-xl" />
      </div>

      {/* Lista */}
      <div className="space-y-3 mt-6">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="h-16 rounded-xl" />
        <SkeletonBlock className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Título */}
      <SkeletonBlock className="h-6 w-56" />
      <SkeletonBlock className="h-4 w-80" />

      {/* Campos */}
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-10 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-10 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-10 rounded-md" />
        </div>
      </div>

      {/* Botón */}
      <SkeletonBlock className="h-11 w-full rounded-lg mt-6" />
    </div>
  );
}

export function ContentSkeleton({ variant = 'dashboard' }: ContentSkeletonProps) {
  return variant === 'form' ? <FormSkeleton /> : <DashboardSkeleton />;
}
