/**
 * Componente Skeleton compartido
 * Usado en múltiples lugares del LoanCalculator
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-neutral-200", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}
