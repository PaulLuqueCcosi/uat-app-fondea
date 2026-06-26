'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import type { FormEditPolicy } from '@/lib/types/form-edit-policy';

interface FormEditPolicyDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  policy: FormEditPolicy;
}

/**
 * Modal de confirmación al guardar cambios en datos verificados.
 * Solo se muestra cuando policy = CONFIRM_REQUIRED.
 */
export function FormEditPolicyDialog({
  open,
  onConfirm,
  onCancel,
  policy,
}: FormEditPolicyDialogProps) {
  if (policy !== 'CONFIRM_REQUIRED') return null;

  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
              <AlertTriangle className="h-5 w-5 text-primary-600" />
            </div>
            <AlertDialogTitle>¿Guardar cambios?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Al guardar, tu verificación actual se reemplazará con los nuevos datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Sí, guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
