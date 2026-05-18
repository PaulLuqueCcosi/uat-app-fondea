'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbEntry[];
  actions?: ReactNode;
}

/**
 * PageHeader — Header del SidebarInset.
 *
 * Contiene:
 * - SidebarTrigger (colapsa/expande el sidebar)
 * - Separador vertical
 * - Breadcrumb navegable
 * - Slot de acciones (botones, etc.)
 *
 * Va siempre al inicio del contenido de cada página del dashboard.
 *
 * Uso:
 * ```tsx
 * <PageHeader
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Calculadora' },
 *   ]}
 *   actions={<Button>Solicitar</Button>}
 * />
 * ```
 */
export function PageHeader({ breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-2">
        {/* Trigger para colapsar/expandir el sidebar */}
        <SidebarTrigger className="-ml-1" />

        {breadcrumbs && breadcrumbs.length > 0 && (
          <>
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <span key={idx} className="flex items-center gap-1.5">
                      <BreadcrumbItem className={idx < breadcrumbs.length - 1 ? 'hidden md:block' : ''}>
                        {crumb.href && !isLast ? (
                          <BreadcrumbLink render={<Link href={crumb.href} />}>
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </span>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
      </div>

      {/* Slot de acciones */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
