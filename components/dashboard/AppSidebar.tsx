'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  CreditCard,
  Briefcase,
  DollarSign,
  Users,
  MapPin,
  FileText,
  Settings,
  ClipboardList,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const profileSections = [
  { path: '/dashboard/section/kyc-validation', label: 'Verificación KYC', icon: CreditCard, status: 'pending' as const },
  { path: '/dashboard/section/labor', label: 'Perfil Laboral', icon: Briefcase, status: 'pending' as const },
  { path: '/dashboard/section/economic', label: 'Perfil Económico', icon: DollarSign, status: 'pending' as const },
  { path: '/dashboard/section/references', label: 'Referencias', icon: Users, status: 'completed' as const },
  { path: '/dashboard/section/additional', label: 'Info Adicional', icon: MapPin, status: 'pending' as const },
];

const mainNav = [
  { path: '/dashboard', label: 'Inicio', icon: Home },
  { path: '/dashboard/profile', label: 'Mi Perfil', icon: User },
  { path: '/dashboard/loans', label: 'Mis Solicitudes', icon: FileText },
  { path: '/dashboard/dev-tools', label: 'Dev Tools', icon: Terminal },
  { path: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const isProfileSection = profileSections.some(s => pathname?.startsWith(s.path));

  return (
    // collapsible="icon" → colapsa a íconos en desktop
    // SidebarRail → el rail lateral que permite colapsar al hacer hover/click
    <Sidebar collapsible="icon" className="top-16 h-[calc(100svh-4rem)]" {...props}>

      {/* Header — avatar de usuario */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0 text-sm">
                U
              </div>
              <div className="min-w-0 flex-1 grid leading-tight">
                <span className="font-semibold text-sm truncate">Usuario</span>
                <span className="text-xs text-warning-700 truncate">Perfil incompleto</span>
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
                  pathname?.startsWith(item.path) &&
                  !isProfileSection);

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

        {/* Expediente — grupo colapsable */}
        <SidebarGroup>
          <SidebarGroupLabel>Expediente</SidebarGroupLabel>
          <SidebarMenu>
            <Collapsible
              defaultOpen={isProfileSection}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip="Expediente"
                    isActive={isProfileSection}
                  />
                }
              >
                <ClipboardList />
                <span>Expediente</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {profileSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = pathname?.startsWith(section.path);

                    return (
                      <SidebarMenuSubItem key={section.path}>
                        <SidebarMenuSubButton
                          isActive={isActive}
                          render={<Link href={section.path} />}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="flex-1 truncate">{section.label}</span>
                          <Badge
                            variant={section.status}
                            className="scale-75 origin-right shrink-0"
                          />
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />

      {/* Rail — permite colapsar el sidebar al hacer hover */}
      <SidebarRail />
    </Sidebar>
  );
}
