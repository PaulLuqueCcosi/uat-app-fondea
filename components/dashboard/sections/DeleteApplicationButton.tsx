'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteApplicationAction } from '@/app/actions/application.actions';
import { useRouter } from 'next/navigation';

// TODO: Este componente es temporal para pruebas, debe eliminarse en producción

interface DeleteApplicationButtonProps {
  applicationId: string;
}

export function DeleteApplicationButton({ applicationId }: DeleteApplicationButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    // Mostrar mensaje de confirmación
    const confirmed = window.confirm(
      '⚠️ ESTO ES SOLO TEMPORAL PARA PRUEBAS\n\n¿Estás seguro de que deseas eliminar esta solicitud?\n\nEsta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteApplicationAction(applicationId);

      if (result.success) {
        // Refrescar la página para actualizar la lista
        router.refresh();
      } else {
        alert(`Error al eliminar: ${result.error}`);
      }
    } catch (error) {
      alert('Error inesperado al eliminar la solicitud');
      console.error('Error al eliminar solicitud:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      }}
      disabled={isDeleting}
      className="p-2 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Eliminar solicitud (solo pruebas)"
    >
      <Trash2 className={`w-4 h-4 ${isDeleting ? 'text-red-300' : 'text-red-500'}`} />
    </button>
  );
}
