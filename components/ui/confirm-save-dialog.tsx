'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ─── Configuración centralizada ──────────────────────────────────────────────
// Edita estos textos para cambiar TODOS los modales de confirmación de guardado.

const CONFIRM_DIALOG_CONFIG = {
  title: '¿Guardar cambios?',
  description:
    'Al guardar, tu verificación actual se reemplazará con los nuevos datos.',
  cancelLabel: 'Cancelar',
  confirmLabel: 'Sí, guardar',
};

// ─── Componente ──────────────────────────────────────────────────────────────

interface ConfirmSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Override del título (opcional) */
  title?: string;
  /** Override de la descripción (opcional) */
  description?: string;
}

/**
 * Modal de confirmación que aparece al guardar cambios en un formulario
 * que ya estaba verificado. Se usa en todos los formularios del funnel/dashboard.
 *
 * Para cambiar el texto de TODOS los modales, edita CONFIRM_DIALOG_CONFIG arriba.
 * Para un override puntual, pasa las props `title` o `description`.
 */
export function ConfirmSaveDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: ConfirmSaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? CONFIRM_DIALOG_CONFIG.title}</DialogTitle>
          <DialogDescription>
            {description ?? CONFIRM_DIALOG_CONFIG.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {CONFIRM_DIALOG_CONFIG.cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {CONFIRM_DIALOG_CONFIG.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
