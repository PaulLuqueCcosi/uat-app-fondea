import { Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PassportRangesPage } from '@/components/admin/settings/PassportRangesPage';

export default async function AdminPassportRangesSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Back */}
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Configuración
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
          <Award className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Rangos del Pasaporte</h1>
          <p className="text-sm text-muted-foreground">
            Categorías de puntaje de fidelización y límite de préstamo por rango
          </p>
        </div>
      </div>

      <PassportRangesPage />
    </div>
  );
}
