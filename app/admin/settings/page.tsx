import { Settings } from 'lucide-react';
import { AdminSettingsClient } from '@/components/admin/settings/AdminSettingsClient';

export default async function AdminSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Configuración del Sistema</h1>
          <p className="text-sm text-muted-foreground">Parámetros operativos configurables</p>
        </div>
      </div>

      <AdminSettingsClient />
    </div>
  );
}
