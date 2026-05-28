import Link from 'next/link';
import { Settings, User, Bell, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

async function getQuickSettings(): Promise<SettingItem[]> {
  // TODO: Obtener desde BD si es necesario
  return [
    { label: 'Mi Perfil', icon: User, path: '/dashboard/profile' },
    { label: 'Seguridad', icon: Settings, path: '/dashboard/settings' },
    { label: 'Notificaciones', icon: Bell, path: '/dashboard/settings' },
  ];
}

async function QuickSettingsContent() {
  const settings = await getQuickSettings();

  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-dark">Configuración rápida</h2>
      </div>
      <div className="divide-y divide-border">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.path}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-background transition-colors"
            >
              <span className="flex items-center gap-2.5 text-sm text-dark">
                <Icon className="w-4 h-4 text-fondea-text" />
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-fondea-text" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function QuickSettingsSkeleton() {
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        {/* Icono */}
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        {/* Título */}
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-full flex items-center justify-between px-5 py-3">
            {/* Icono + Texto */}
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            {/* Chevron */}
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export const QuickSettings = Object.assign(QuickSettingsContent, {
  Skeleton: QuickSettingsSkeleton,
});
