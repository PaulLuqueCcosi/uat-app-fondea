'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  Settings,
  User,
  CreditCard,
  LifeBuoy,
  Bell,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SupportDialog } from './SupportDialog';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

/** Genera breadcrumbs desde el pathname */
function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.replace('/dashboard', '').split('/').filter(Boolean);

  if (segments.length === 0) return [{ label: 'Dashboard' }];

  const labelMap: Record<string, string> = {
    'mi-perfil': 'Mi Perfil',
    'mi-expediente': 'Mi Expediente',
    'loans': 'Mis Solicitudes',
    'calculadora': 'Calculadora',
    'settings': 'Configuración',
    'profile': 'Perfil',
    'dev-tools': 'Dev Tools',
    'lambda-tester': 'Lambda Tester',
  };

  const crumbs: { label: string; href?: string }[] = [
    { label: 'Dashboard', href: '/dashboard' },
  ];

  let path = '/dashboard';
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

interface DashboardNavbarProps {
  user: { name: string; email: string; dni?: string | null; id?: string | null };
  onSignOut: () => Promise<void>;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DashboardNavbar({ user, onSignOut }: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [supportOpen, setSupportOpen] = useState(false);

  const handleSignOut = () => {
    startTransition(async () => {
      await onSignOut();
    });
  };

  const initials = getInitials(user.name);
  const subtitle = user.email || '';
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-border bg-white/90 backdrop-blur-md px-4">
      {/* Izquierda: Logo + SidebarTrigger + Breadcrumb */}
      <div className="flex flex-1 items-center gap-2">
        <Link href="/dashboard" className="flex items-center shrink-0">
          <Logo height={24} />
        </Link>

        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-5" />

        <SidebarTrigger className="-ml-0.5" />

        {breadcrumbs.length > 1 && (
          <>
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
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

      {/* Derecha: Notificaciones + Usuario */}
      <div className="flex items-center gap-1">
        {/* Campana de notificaciones */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {/* Indicador de notificación sin leer */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error-500" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 rounded-full p-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Menú de usuario"
          >
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-medium text-foreground max-w-[140px] truncate">
                {user.name}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground max-w-[140px] truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-50 text-primary-700 font-medium text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-2.5 py-0.5">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary-50 text-primary-700 font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                    {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard/mi-perfil')}>
                <User className="h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/loans')}>
                <CreditCard className="h-4 w-4" />
                Mis Solicitudes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="h-4 w-4" />
                Configuración
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setSupportOpen(true)}>
                <LifeBuoy className="h-4 w-4" />
                Soporte
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isPending}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {isPending ? 'Cerrando sesión…' : 'Cerrar Sesión'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog de soporte */}
      <SupportDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
        userDni={user.dni}
        userId={user.id}
      />
    </header>
  );
}
