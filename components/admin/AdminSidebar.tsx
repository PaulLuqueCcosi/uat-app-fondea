'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  BarChart,
  ArrowLeftRight,
  Target,
  Wallet,
  TrendingUp,
  PieChart,
  Shield,
  Calculator,
  Sliders,
  FileCode2,
  MessageSquareWarning,
  UserMinus,
  Handshake,
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

const kpisNav = [
  { path: '/admin/analytics', label: 'KPIs Globales', icon: TrendingUp },
  { path: '/admin/nps', label: 'NPS', icon: BarChart },
];

const carteraNav = [
  { path: '/admin/credits', label: 'Créditos', icon: CreditCard },
  { path: '/admin/portfolio', label: 'Cartera', icon: PieChart },
];

const cobranzaNav = [
  { path: '/admin/collections', label: 'Cobranza', icon: BarChart3 },
  { path: '/admin/negotiation-offers', label: 'Negociaciones', icon: Handshake },
];

const mainNav = [
  { path: '/admin/intentions', label: 'Intenciones', icon: Target },
  { path: '/admin/applications', label: 'Solicitudes', icon: FileText },
];

const clientesNav = [
  { path: '/admin/users', label: 'Usuarios', icon: Users },
  { path: '/admin/complaints', label: 'Reclamaciones', icon: MessageSquareWarning },
  { path: '/admin/customers/churn', label: 'Riesgo de Churn', icon: UserMinus },
  { path: '/admin/customers/segmentation', label: 'Segmentación', icon: PieChart },
];

const businessRulesNav = [
  { path: '/admin/calculator', label: 'Calculadora', icon: Calculator },
  { path: '/admin/evaluation-rules', label: 'Reglas Motor', icon: Shield },
  { path: '/admin/scoring', label: 'Scorecard', icon: Sliders },
  { path: '/admin/contracts', label: 'Contratos', icon: FileCode2 },
];

const configNav = [
  { path: '/admin/fund', label: 'Fondo de Capital', icon: Wallet },
  { path: '/admin/settings', label: 'Configuración', icon: Settings, exact: true },
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

      {/* Navegación */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>M1 - KPIs Globales</SidebarGroupLabel>
          <SidebarMenu>
            {kpisNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path ||
                (pathname === '/admin' && item.path === '/admin/analytics') ||
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>M2 - Cartera y Préstamos</SidebarGroupLabel>
          <SidebarMenu>
            {carteraNav.map((item) => {
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>M3 - Cobranza y Mora</SidebarGroupLabel>
          <SidebarMenu>
            {cobranzaNav.map((item) => {
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => {
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>M4 - Clientes</SidebarGroupLabel>
          <SidebarMenu>
            {clientesNav.map((item) => {
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Reglas de Negocio</SidebarGroupLabel>
          <SidebarMenu>
            {businessRulesNav.map((item) => {
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarMenu>
            {configNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.path
                : pathname === item.path || pathname?.startsWith(item.path);

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
