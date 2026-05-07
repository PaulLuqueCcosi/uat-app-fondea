import { CheckCircle2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Banner de "Perfil guardado" — se muestra en la vista readonly de los formularios
 * después de guardar exitosamente.
 *
 * @example
 * <VerifiedBanner
 *   title="Perfil laboral guardado"
 *   description="Tu información laboral está registrada."
 *   onEdit={() => setIsEditing(true)}
 * />
 */

interface VerifiedBannerProps {
  /** Título principal (ej: "Perfil laboral guardado") */
  title: string;
  /** Descripción secundaria */
  description: string;
  /** Callback al hacer click en "Editar" */
  onEdit: () => void;
}

export function VerifiedBanner({ title, description, onEdit }: VerifiedBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 px-4 py-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-success-700">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="shrink-0 gap-1.5"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
    </div>
  );
}
