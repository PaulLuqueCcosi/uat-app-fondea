import { Settings, User, Bell, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SettingItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

// Función para obtener opciones de configuración
async function getQuickSettings(): Promise<SettingItem[]> {
  // TODO: Reemplazar con llamada real a BD si es necesario
  // const settings = await getSettingsFromDB();
  // return settings;
  
  // Por ahora retornar datos estáticos
  return [
    { label: 'Mi Perfil', icon: User, path: '/dashboard/profile' },
    { label: 'Seguridad', icon: Settings, path: '/dashboard/settings' },
    { label: 'Notificaciones', icon: Bell, path: '/dashboard/settings' },
  ];
}

export async function QuickSettingsSectionServer() {
  // Obtener datos reales del servidor
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
            <a
              key={item.label}
              href={item.path}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-background transition-colors"
            >
              <span className="flex items-center gap-2.5 text-sm text-dark">
                <Icon className="w-4 h-4 text-fondea-text" />
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-fondea-text" />
            </a>
          );
        })}
      </div>
    </Card>
  );
}
