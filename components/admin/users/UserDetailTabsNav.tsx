'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Shield, Award, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserDetailTabsNavProps {
  userId: string;
}

const TABS = [
  { segment: 'expedientes', label: 'Expedientes', icon: FileText },
  { segment: 'score', label: 'Score', icon: Shield },
  { segment: 'puntaje', label: 'Puntaje', icon: Award },
  { segment: 'solicitudes', label: 'Solicitudes', icon: FileText },
  { segment: 'referidos', label: 'Referidos', icon: Users },
];

/**
 * Barra de tabs del detalle de usuario — mismo patrón de ruta activa (usePathname + startsWith)
 * que ya usa components/admin/AdminSidebar.tsx, pero como tabs horizontales en vez de sidebar.
 */
export function UserDetailTabsNav({ userId }: UserDetailTabsNavProps) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-5 w-full max-w-2xl gap-1 rounded-lg bg-muted p-1">
      {TABS.map((tab) => {
        const href = `/admin/users/${userId}/${tab.segment}`;
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
