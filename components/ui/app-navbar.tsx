'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Settings,
  User,
  LogOut,
  CreditCard,
  LifeBuoy,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { User as UserType } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "Juan Carlos Pérez" → "JP" */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AppNavbarProps {
  user: UserType;
  onSignOut: () => Promise<void>;
  /**
   * Cuando se pasa, muestra "← Volver" a la izquierda del logo.
   * Útil en /solicitar y /solicitudes/[id].
   */
  backLink?: {
    href: string;
    label?: string;
  };
}

// ── Avatar compartido ─────────────────────────────────────────────────────────

function UserAvatar({ initials, size = 'sm' }: { initials: string; size?: 'sm' | 'md' }) {
  return (
    <Avatar className={size === 'md' ? 'h-9 w-9' : 'h-8 w-8'}>
      <AvatarFallback className="bg-primary-50 text-primary-700 font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AppNavbar({ user, onSignOut, backLink }: AppNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await onSignOut();
    });
  };

  const initials = getInitials(user.name);
  const subtitle = user.email || user.phone || '';

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 md:px-6">

        {/* ── Izquierda: logo + back (opcional) ── */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center">
            <Logo height={28} />
          </Link>

          {backLink && (
            <>
              <div className="h-5 w-px bg-border" />
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </>
          )}
        </div>

        {/* ── Derecha: notificaciones + usuario ── */}
        <div className="flex items-center gap-1">

          {/* Notificaciones */}
          {/* <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error-500 ring-2 ring-white"
              aria-hidden
            />
          </Button> */}

          <div className="mx-2 h-6 w-px bg-border" />

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2.5 rounded-full p-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menú de usuario"
            >
              {/* Nombre + email — solo desktop */}
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

              <UserAvatar initials={initials} size="sm" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56">

              {/* Header — info del usuario */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2.5 py-0.5">
                    <UserAvatar initials={initials} size="md" />
                    <div className="flex flex-col leading-tight min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </span>
                      {subtitle && (
                        <span className="text-xs text-muted-foreground truncate">
                          {subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Navegación */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/profile')}
                  className={pathname === '/dashboard/profile' ? 'bg-primary-50 text-primary font-semibold' : ''}
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/loans')}
                  className={pathname === '/dashboard/loans' ? 'bg-primary-50 text-primary font-semibold' : ''}
                >
                  <CreditCard className="h-4 w-4" />
                  Mis Solicitudes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/settings')}
                  className={pathname === '/dashboard/settings' ? 'bg-primary-50 text-primary font-semibold' : ''}
                >
                  <Settings className="h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem disabled>
                  <LifeBuoy className="h-4 w-4" />
                  Soporte
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Cerrar sesión */}
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
      </div>
    </header>
  );
}
