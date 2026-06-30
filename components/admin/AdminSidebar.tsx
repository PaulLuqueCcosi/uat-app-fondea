'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  Shield,
  ArrowLeftRight,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const mainNav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Usuarios', icon: Users },
  { path: '/admin/applications', label: 'Solicitudes', icon: FileText },
  { path: '/admin/credits', label: 'Créditos', icon: CreditCard },
  { path: '/admin/collections', label: 'Cobranza', icon: BarChart3 },
  { path: '/admin/calculator', label: 'Calculadora', icon: Settings },
  { path: '/admin/contracts', label: 'Contratos', icon: FileText },
  { path: '/admin/notifications', label: 'Notificaciones', icon: Settings },
  { path: '/admin/referrals', label: 'Referidos', icon: Users },
];

const configNav = [
  { path: '/admin/roles', label: 'Roles y Permisos', icon: Shield },
  { path: '/admin/settings', label: 'Configuración', icon: Settings },
];

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { name: string; avatar?: string | null };
}

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  const pathname = usePathname();
  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
    : 'A';

  return (
    <Sidebar collapsible="icon" className="top-14 h-[calc(100svh-3.5rem)]" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1 grid leading-tight">
                <span className="font-semibold text-sm truncate">{user?.name || 'Admin'}</span>
                <span className="text-xs text-muted-foreground truncate">Administrador</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navegación principal */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (item.path !== '/admin' && pathname?.startsWith(item.path));

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    render={<Link href={item.path} />}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarMenu>
            {configNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                pathname?.startsWith(item.path);

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    render={<Link href={item.path} />}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Ir al portal cliente"
              render={<Link href="/dashboard" />}
            >
              <ArrowLeftRight />
              <span>Modo Cliente</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
