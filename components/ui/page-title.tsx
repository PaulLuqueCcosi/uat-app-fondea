import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * PageTitle — Título de página con línea decorativa.
 *
 * Uso:
 * ```tsx
 * <PageTitle
 *   title="Simula tu préstamo"
 *   description="Configura monto, plazo y cuotas."
 * />
 * ```
 */
export function PageTitle({ title, description, className }: PageTitleProps) {
  return (
    <div className={cn('mb-6', className)}>
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-1">
        {title}
      </h1>
      {description && (
        <p className="text-sm sm:text-base text-fondea-text">
          {description}
        </p>
      )}
      {/* <div className="h-1 w-40 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full mb-3" /> */}
    </div>
  );
}
