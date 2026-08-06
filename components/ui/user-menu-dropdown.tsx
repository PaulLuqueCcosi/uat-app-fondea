'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  Settings,
  LogOut,
  CreditCard,
  LifeBuoy,
  MessageSquareWarning,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SupportDialog } from '@/components/dashboard/SupportDialog';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface UserMenuDropdownProps {
  user: {
    name: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
    dni?: string | null;
    id?: string | null;
  };
  onSignOut: () => Promise<void>;
}

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * Menú de usuario reutilizable para todas las navbars.
 * Muestra avatar + nombre + dropdown con navegación y logout.
 */
export function UserMenuDropdown({ user, onSignOut }: UserMenuDropdownProps) {
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
  const subtitle = user.email || user.phone || '';

  return (
    <>
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
          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          <AvatarFallback className="bg-primary-50 text-primary-700 font-medium text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        {/* Header — info del usuario */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-2.5 py-0.5">
              <Avatar className="h-9 w-9">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
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
          <DropdownMenuItem
            onClick={() => router.push('/dashboard/reclamos')}
            className={pathname === '/dashboard/reclamos' ? 'bg-primary-50 text-primary font-semibold' : ''}
          >
            <MessageSquareWarning className="h-4 w-4" />
            Libro de Reclamaciones
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

    <SupportDialog
      open={supportOpen}
      onOpenChange={setSupportOpen}
      userDni={user.dni}
      userId={user.id}
    />
    </>
  );
}
