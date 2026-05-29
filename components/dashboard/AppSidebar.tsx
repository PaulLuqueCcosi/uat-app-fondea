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
} from '@/components/ui/sidebar';

const mainNav = [
  { path: '/dashboard', label: 'Inicio', icon: Home },
  { path: '/dashboard/profile', label: 'Mi Perfil', icon: User },
  { path: '/dashboard/loans', label: 'Mis Solicitudes', icon: FileText },
  { path: '/dashboard/dev-tools', label: 'Dev Tools', icon: Terminal },
  { path: '/dashboard/dev-tools/lambda-tester', label: 'Lambda Tester', icon: Zap },
  { path: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profileComplete: boolean;
}

export function AppSidebar({ profileComplete, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    // collapsible="icon" → colapsa a íconos en desktop
    // SidebarRail → el rail lateral que permite colapsar al hacer hover/click
    <Sidebar collapsible="icon" className="top-16 h-[calc(100svh-4rem)]" {...props}>

      {/* Header — avatar de usuario */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                U
              </div>
              <div className="min-w-0 flex-1 grid leading-tight">
                <span className="font-semibold text-sm truncate">Usuario</span>
                <span className={`text-xs truncate ${profileComplete ? 'text-emerald-600' : 'text-warning-700'}`}>
                  {profileComplete ? 'Perfil completo' : 'Perfil incompleto'}
                </span>
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

        {/* Expediente — grupo colapsable (deshabilitado temporalmente) */}
      </SidebarContent>

      <SidebarFooter />

      {/* Rail — permite colapsar el sidebar al hacer hover */}
      <SidebarRail />
    </Sidebar>
  );
}
