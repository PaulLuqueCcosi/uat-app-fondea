'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ComplaintForm } from './ComplaintForm';
import { ComplaintsList } from './ComplaintsList';
import type { MyComplaint, Pagination } from '@/modules/complaints';

interface ComplaintsPageClientProps {
  complaints: MyComplaint[];
  pagination: Pagination;
  defaultPhone?: string | null;
  defaultEmail?: string | null;
}

export function ComplaintsPageClient({ complaints, pagination, defaultPhone, defaultEmail }: ComplaintsPageClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {pagination.totalItems === 0
            ? 'No tienes reclamos registrados'
            : `${pagination.totalItems} reclamo${pagination.totalItems > 1 ? 's' : ''} registrado${pagination.totalItems > 1 ? 's' : ''}`}
        </p>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo reclamo
        </Button>
      </div>

      <ComplaintsList complaints={complaints} pagination={pagination} />

      <ComplaintForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => setShowForm(false)}
        defaultPhone={defaultPhone}
        defaultEmail={defaultEmail}
      />
    </div>
  );
}
