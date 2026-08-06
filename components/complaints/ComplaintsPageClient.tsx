'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { ComplaintForm } from './ComplaintForm';
import { ComplaintsList } from './ComplaintsList';
import type { MyComplaint } from '@/modules/complaints';

interface ComplaintsPageClientProps {
  complaints: MyComplaint[];
}

export function ComplaintsPageClient({ complaints }: ComplaintsPageClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Botón para abrir formulario */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {complaints.length === 0
            ? 'No tienes reclamos registrados'
            : `${complaints.length} reclamo${complaints.length > 1 ? 's' : ''} registrado${complaints.length > 1 ? 's' : ''}`}
        </p>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'ghost' : 'default'}
          size="sm"
          className="gap-2"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nuevo reclamo
            </>
          )}
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <ComplaintForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Lista */}
      <ComplaintsList complaints={complaints} />
    </div>
  );
}
