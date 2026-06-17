'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  Settings,
  User,
  CreditCard,
  LifeBuoy,
  Bell,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useNotificationStore } from '@/modules/notifications';
import { getNotificationRoute } from '@/modules/notifications';
import type { Notification } from '@/modules/notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  user: { name: string; email: string; avatar?: string | null; dni?: string | null; id?: string | null };
  onSignOut: () => Promise<void>;
}

// ── Notification Bell ──────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function NotificationBell() {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const hasUrgent = useNotificationStore((s) => s.hasUrgent);
  const notifications = useNotificationStore((s) => s.notifications);
  const status = useNotificationStore((s) => s.status);
  const fetchAll = useNotificationStore((s) => s.fetchAll);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Cargar lista completa al abrir
  useEffect(() => {
    if (open && status === 'idle') {
      fetchAll();
    }
  }, [open, status, fetchAll]);

  const handleClick = (notification: Notification) => {
    // Al hacer click → marcar como leída
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleGoToDetail = (notification: Notification) => {
    const route = getNotificationRoute(notification);
    if (route) {
      setOpen(false);
      router.push(route);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`} />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 ${
              hasUrgent ? 'bg-error-500 animate-pulse' : 'bg-primary-500'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 sm:w-96 p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary h-auto py-1 px-2"
              onClick={() => markAllAsRead()}
            >
              Marcar todo como leído
            </Button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-[400px] overflow-y-auto">
          {status === 'pending' && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-4">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`relative px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !n.read ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 pr-20">
                    {/* Dot indicador */}
                    <div className="pt-1.5 shrink-0">
                      {!n.read ? (
                        <span className={`block w-2 h-2 rounded-full ${
                          n.priority === 'urgent' ? 'bg-error-500' :
                          n.priority === 'high' ? 'bg-warning-500' :
                          'bg-primary-500'
                        }`} />
                      ) : (
                        <span className="block w-2 h-2 rounded-full bg-transparent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!n.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatTimeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="absolute top-2.5 right-3 flex items-center gap-0.5">
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Marcar como leída"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {getNotificationRoute(n) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGoToDetail(n); }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Ver detalle"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      className="p-1.5 rounded-md hover:bg-error-50 text-muted-foreground hover:text-error-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
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
        <NotificationBell />

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

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
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
