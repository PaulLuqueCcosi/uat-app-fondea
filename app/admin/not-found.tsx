import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Construction className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Sección no disponible
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta sección aún no está implementada o la URL es incorrecta.
            Vuelve al panel principal.
          </p>
        </div>

        <Button size="default">
          <Link href="/admin">
            {/* <ArrowLeft className="h-4 w-4" /> */}
            Volver al panel
          </Link>
        </Button>
      </div>
    </div>
  );
}
