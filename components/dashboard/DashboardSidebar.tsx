'use client';

import { useState } from 'react';
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const profileSections = [
  { path: '/dashboard/section/kyc', label: 'Verificación KYC', icon: CreditCard, status: 'pending' as const },
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const isProfileSection = profileSections.some(s => pathname?.startsWith(s.path));
  const [expedienteOpen, setExpedienteOpen] = useState(isProfileSection);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn('relative flex-shrink-0 transition-all duration-200', collapsed ? 'w-16' : 'w-64 md:w-56 lg:w-64')}>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(o => !o)}
        title={collapsed ? 'Expandir' : 'Colapsar'}
        className="absolute -right-3 top-6 z-20 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center text-fondea-text hover:text-primary hover:border-primary shadow-sm transition-all"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <aside className="w-full bg-white border-r border-border flex flex-col sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {/* User info */}
        <div className={cn('border-b border-border', collapsed ? 'p-3 flex justify-center' : 'p-5')}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0" title="Usuario">
              U
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                U
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-dark text-sm truncate">Usuario</p>
                <Badge variant="warning" className="mt-0.5">Perfil incompleto</Badge>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path ||
              (item.path !== '/dashboard' &&
                pathname?.startsWith(item.path) &&
                !isProfileSection);
            return (
              <Link
                key={item.path}
                href={item.path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm transition-all',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-primary-50 text-primary font-semibold'
                    : 'text-fondea-text hover:bg-background hover:text-dark'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}

          {/* Expediente group */}
          <div className="mt-2">
            {collapsed ? (
              <Link
                href="/dashboard/section/kyc"
                title="Expediente"
                className={cn(
                  'flex justify-center px-2 py-2.5 rounded-lg text-sm transition-all',
                  isProfileSection
                    ? 'bg-primary-50 text-primary'
                    : 'text-fondea-text hover:bg-background hover:text-dark'
                )}
              >
                <ClipboardList className="w-4 h-4 flex-shrink-0" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setExpedienteOpen(o => !o)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                    isProfileSection
                      ? 'bg-primary-50 text-primary'
                      : 'text-fondea-text hover:bg-background hover:text-dark'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <ClipboardList className="w-4 h-4 flex-shrink-0" />
                    Expediente
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                      expedienteOpen ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                </button>
                {expedienteOpen && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {profileSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = pathname === section.path;
                      return (
                        <Link
                          key={section.path}
                          href={section.path}
                          className={cn(
                            'flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-lg text-xs transition-all',
                            isActive
                              ? 'bg-primary-50 text-primary font-medium'
                              : 'text-fondea-text hover:bg-background hover:text-dark'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 min-w-0 truncate">{section.label}</span>
                          <Badge variant={section.status} className="scale-75 origin-right" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </aside>
    </div>
  );
}
