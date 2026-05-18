'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /**
   * Máximo ancho del contenedor.
   * @default 'max-w-4xl'
   */
  maxWidth?: 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-full';
  /**
   * Padding horizontal.
   * @default 'px-4 md:px-6 lg:px-8'
   */
  padding?: string;
  /**
   * Padding vertical.
   * @default 'py-4 md:py-6 lg:py-8'
   */
  paddingY?: string;
}

/**
 * PageContainer — Contenedor responsivo para el contenido principal del dashboard.
 * 
 * Proporciona:
 * - Máximo ancho configurable (por defecto 4xl)
 * - Padding responsivo (móvil, tablet, desktop)
 * - Centrado automático
 * - Fondo limpio
 * 
 * Uso:
 * ```tsx
 * <PageContainer maxWidth="max-w-3xl">
 *   <PageHeader title="Mi página" />
 *   <div>Contenido aquí</div>
 * </PageContainer>
 * ```
 */
export function PageContainer({
  children,
  className,
  maxWidth = 'max-w-4xl',
  padding = 'px-4 md:px-6 lg:px-8',
  paddingY = 'py-4 md:py-6 lg:py-8',
}: PageContainerProps) {
  return (
    <div className={cn('w-full mx-auto', maxWidth, padding, paddingY, className)}>
      {children}
    </div>
  );
}
