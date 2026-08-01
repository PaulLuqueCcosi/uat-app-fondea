'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Briefcase, DollarSign, Users, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpedienteModuleTabsNavProps {
  userId: string;
}

const MODULE_TABS = [
  { segment: 'kyc', label: 'KYC', icon: Shield },
  { segment: 'labor', label: 'Laboral', icon: Briefcase },
  { segment: 'economic', label: 'Económico', icon: DollarSign },
  { segment: 'references', label: 'Referencias', icon: Users },
  { segment: 'address', label: 'Dirección', icon: MapPin },
  { segment: 'bank-account', label: 'Banco', icon: Building2 },
];

export function ExpedienteModuleTabsNav({ userId }: ExpedienteModuleTabsNavProps) {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex items-center gap-1 border-b min-w-max">
        {MODULE_TABS.map((tab) => {
          const href = `/admin/users/${userId}/expedientes/${tab.segment}`;
          const isActive = pathname === href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
