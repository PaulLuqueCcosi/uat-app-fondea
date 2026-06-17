'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  FileText,
  Settings,
  Terminal,
  Zap,
  GraduationCap,
  CreditCard,
  Award,
  Users,
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
  { path: '/dashboard', label: 'Inicio', icon: Home },
  { path: '/dashboard/educacion', label: 'Fondea Aprende', icon: GraduationCap },
  { path: '/dashboard/profile', label: 'Mi Perfil', icon: User },
  { path: '/dashboard/pasaporte', label: 'Pasaporte Financiero', icon: Award },
  { path: '/dashboard/loans', label: 'Mis Solicitudes', icon: FileText },
  { path: '/dashboard/referidos', label: 'Referidos', icon: Users },
  { path: '/dashboard/mi-expediente', label: 'Mi Expedientes', icon: FileText },
];

const devNav = [
  { path: '/dashboard/creditos', label: 'Mis Créditos', icon: CreditCard },
  { path: '/dashboard/dev-tools', label: 'Dev Tools', icon: Terminal },
  { path: '/dashboard/dev-tools/lambda-tester', label: 'Lambda Tester', icon: Zap },
  // { path: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { name: string; avatar?: string | null };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
    : 'U';

  return (
    // collapsible="icon" → colapsa a íconos en desktop
    // SidebarRail → el rail lateral que permite colapsar al hacer hover/click
    <Sidebar collapsible="icon" className="top-14 h-[calc(100svh-3.5rem)]" {...props}>

      {/* Header — avatar de usuario */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1 grid leading-tight">
                <span className="font-semibold text-sm truncate">{user?.name || 'Usuario'}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navegación principal */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (item.path !== '/dashboard' &&
                  pathname?.startsWith(item.path));

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
          <SidebarGroupLabel>En desarrollo</SidebarGroupLabel>
          <SidebarMenu>
            {devNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (item.path !== '/dashboard' &&
                  pathname?.startsWith(item.path));

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

      <SidebarFooter />

      {/* Rail — permite colapsar el sidebar al hacer hover */}
      <SidebarRail />
    </Sidebar>
  );
}
