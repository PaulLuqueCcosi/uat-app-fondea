'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, FileText, Shield, Award, ClipboardList, Users, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserDetailNavProps {
  userId: string;
}

const NAV_ITEMS = [
  { segment: '', label: 'Datos', icon: User },
  { segment: 'expedientes', label: 'Expedientes', icon: FileText },
  { segment: 'score', label: 'Score', icon: Shield },
  { segment: 'puntaje', label: 'Puntaje', icon: Award },
  { segment: 'solicitudes', label: 'Solicitudes', icon: ClipboardList },
  { segment: 'referidos', label: 'Referidos', icon: Users },
  { segment: 'nps', label: 'NPS', icon: Smile },
];

export function UserDetailNav({ userId }: UserDetailNavProps) {
  const pathname = usePathname();
  const basePath = `/admin/users/${userId}`;

  return (
    <nav className="overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex items-center gap-1 border-b min-w-max">
        {NAV_ITEMS.map((item) => {
          const href = item.segment ? `${basePath}/${item.segment}` : basePath;
          const isActive = item.segment
            ? pathname === href || pathname?.startsWith(`${href}/`)
            : pathname === basePath;
          const Icon = item.icon;

          return (
            <Link
              key={item.segment || 'overview'}
              href={href}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
