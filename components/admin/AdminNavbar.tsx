'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean);

  if (segments.length === 0) return [{ label: 'Admin' }];

  const labelMap: Record<string, string> = {
    users: 'Usuarios',
    applications: 'Solicitudes',
    credits: 'Créditos',
    analytics: 'Analítica',
    roles: 'Roles y Permisos',
    settings: 'Configuración',
  };

  const crumbs: { label: string; href?: string }[] = [
    { label: 'Admin', href: '/admin' },
  ];

  let path = '/admin';
  segments.forEach((seg, i) => {
    path += `/${seg}`;
    const isLast = i === segments.length - 1;
    crumbs.push({
      label: labelMap[seg] || seg,
      href: isLast ? undefined : path,
    });
  });

  return crumbs;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AdminNavbarProps {
  user: { name: string; email: string; avatar?: string | null };
  onSignOut: () => Promise<void>;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AdminNavbar({ user, onSignOut }: AdminNavbarProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-border bg-neutral-900 px-4">
      {/* Izquierda: Logo + Badge + SidebarTrigger + Breadcrumb */}
      <div className="flex flex-1 items-center gap-2">
        <Link href="/admin" className="flex items-center shrink-0">
          <Logo height={24} />
        </Link>

        <Badge variant="outline" className="ml-2 text-[10px] border-neutral-600 text-neutral-300">
          ADMIN
        </Badge>

        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-5 bg-neutral-700" />

        <SidebarTrigger className="-ml-0.5 text-neutral-300 hover:text-white hover:bg-neutral-800" />

        {breadcrumbs.length > 1 && (
          <>
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4 bg-neutral-700" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <span key={idx} className="flex items-center gap-1.5">
                      <BreadcrumbItem className={idx < breadcrumbs.length - 1 ? 'hidden md:block' : ''}>
                        {crumb.href && !isLast ? (
                          <BreadcrumbLink render={<Link href={crumb.href} />} className="text-neutral-400 hover:text-white">
                            {crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="text-neutral-200">{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden md:block text-neutral-600" />
                      )}
                    </span>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
      </div>

      {/* Derecha: User menu con sign out */}
      <div className="flex items-center gap-1">
        <AdminUserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
