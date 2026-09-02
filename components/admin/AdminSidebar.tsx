'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  BarChart,
  BarChart3,
  Calculator,
  ChevronRight,
  Cpu,
  CreditCard,
  FileCode2,
  FileText,
  Handshake,
  Megaphone,
  MessageSquareWarning,
  PieChart,
  Receipt,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Target,
  TrendingUp,
  UserMinus,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─────────────────────────────────────────────────────────────
// Data — 2 niveles
// Nivel 1: módulo. Nivel 2: páginas del módulo.
// Un item sin `items` es un enlace directo de nivel 1.
// ─────────────────────────────────────────────────────────────

type NavSubItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  exact?: boolean;
};

type NavItem = {
  title: string;
  icon: React.ElementType;
  url?: string;
  exact?: boolean;
  items?: NavSubItem[];
};

const navMain: NavItem[] = [
  {
    title: 'M1 - KPIs Globales',
    icon: TrendingUp,
    items: [
      { title: 'KPIs Globales', url: '/admin/analytics', icon: TrendingUp },
      { title: 'NPS', url: '/admin/nps', icon: BarChart },
    ],
  },
  {
    title: 'M2 - Cartera y Préstamos',
    icon: CreditCard,
    items: [
      { title: 'Créditos', url: '/admin/credits', icon: CreditCard },
      { title: 'Cartera', url: '/admin/portfolio', icon: PieChart },
      { title: 'Depósitos', url: '/admin/payment-declarations', icon: Receipt },
      { title: 'Constancias No Adeudo', url: '/admin/constancias', icon: ShieldCheck },
    ],
  },
  {
    title: 'M3 - Cobranza y Mora',
    icon: BarChart3,
    items: [
      { title: 'Cobranza', url: '/admin/collections', icon: BarChart3 },
      { title: 'Negociaciones', url: '/admin/negotiation-offers', icon: Handshake },
    ],
  },
  {
    title: 'Principal',
    icon: Target,
    items: [
      { title: 'Intenciones', url: '/admin/intentions', icon: Target },
      { title: 'Solicitudes', url: '/admin/applications', icon: FileText },
    ],
  },
  {
    title: 'M4 - Clientes',
    icon: Users,
    items: [
      { title: 'Usuarios', url: '/admin/users', icon: Users },
      { title: 'Reclamaciones', url: '/admin/complaints', icon: MessageSquareWarning },
      { title: 'Riesgo de Churn', url: '/admin/customers/churn', icon: UserMinus },
      { title: 'Segmentación', url: '/admin/customers/segmentation', icon: PieChart },
    ],
  },
  {
    title: 'M5 - Marketing y Adquisición',
    icon: Megaphone,
    url: '/admin/marketing',
  },
  {
    title: 'M6 - Scoring y Riesgo',
    icon: ShieldAlert,
    url: '/admin/risk-analytics',
  },
  {
    title: 'M8 - Tecnología y APIs',
    icon: Cpu,
    url: '/admin/tech',
  },
  {
    title: 'Reglas de Negocio',
    icon: Sliders,
    items: [
      { title: 'Calculadora', url: '/admin/calculator', icon: Calculator },
      { title: 'Reglas Motor', url: '/admin/evaluation-rules', icon: Shield },
      { title: 'Scorecard', url: '/admin/scoring', icon: Sliders },
      { title: 'Contratos', url: '/admin/contracts', icon: FileCode2 },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    items: [
      { title: 'Fondo de Capital', url: '/admin/fund', icon: Wallet },
      { title: 'Configuración', url: '/admin/settings', icon: Settings, exact: true },
    ],
  },
];

/** `/admin` es la home de KPIs. */
function isUrlActive(pathname: string | null, url: string, exact?: boolean) {
  if (!pathname) return false;
  if (pathname === '/admin') return url === '/admin/analytics';
  if (exact) return pathname === url;
  return pathname === url || pathname.startsWith(`${url}/`);
}

// ─────────────────────────────────────────────────────────────
// NavMain — patrón sidebar-07 (Collapsible) cuando el sidebar
// está expandido, patrón sidebar-06 (DropdownMenu lateral)
// cuando está en modo icono. SidebarMenuSub trae
// `group-data-[collapsible=icon]:hidden` de fábrica, así que el
// dropdown es la única vía nativa para navegar colapsado.
// ─────────────────────────────────────────────────────────────

function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.items?.length ? (
            <NavGroupItem key={item.title} item={item} />
          ) : (
            <NavLinkItem key={item.title} item={item} />
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavLinkItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isUrlActive(pathname, item.url!, item.exact)}
        tooltip={item.title}
        render={<Link href={item.url!} />}
      >
        <Icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const Icon = item.icon;

  const isActive = item.items!.some((sub) =>
    isUrlActive(pathname, sub.url, sub.exact)
  );

  // Modo icono en desktop: submenú como dropdown.
  if (state === 'collapsed' && !isMobile) {
    return (
      <DropdownMenu>
        <SidebarMenuItem>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                isActive={isActive}
                aria-label={item.title}
                className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
              />
            }
          >
            <Icon />
            <span>{item.title}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={4}
            className="min-w-56 rounded-lg"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
              {item.items!.map((sub) => {
                const SubIcon = sub.icon;
                return (
                  <DropdownMenuItem
                    key={sub.url}
                    data-active={
                      isUrlActive(pathname, sub.url, sub.exact) || undefined
                    }
                    className="gap-2 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground"
                    render={<Link href={sub.url} />}
                  >
                    <SubIcon className="text-muted-foreground" />
                    <span>{sub.title}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </SidebarMenuItem>
      </DropdownMenu>
    );
  }

  // Expandido (y móvil): acordeón.
  return (
    <Collapsible
      defaultOpen={isActive}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
        <Icon />
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items!.map((sub) => {
            const SubIcon = sub.icon;
            return (
              <SidebarMenuSubItem key={sub.url}>
                <SidebarMenuSubButton
                  isActive={isUrlActive(pathname, sub.url, sub.exact)}
                  render={<Link href={sub.url} />}
                >
                  <SubIcon />
                  <span>{sub.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { name: string; avatar?: string | null };
}

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
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
        <NavMain items={navMain} />
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
