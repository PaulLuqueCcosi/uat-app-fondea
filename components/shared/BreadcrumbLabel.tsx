'use client';

import { useBreadcrumbLabel } from '@/modules/shared/breadcrumb-labels';

/**
 * Registra el label legible de un segmento dinámico del breadcrumb (ej. el UUID
 * de un crédito → su creditCode) desde un Server Component, que no puede usar
 * el hook `useBreadcrumbLabel` directamente. No renderiza nada.
 */
export function BreadcrumbLabel({ id, label }: { id: string; label: string | null | undefined }) {
  useBreadcrumbLabel(id, label);
  return null;
}
