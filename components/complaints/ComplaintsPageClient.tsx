'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareWarning, Plus } from 'lucide-react';
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <MessageSquareWarning className="w-5 h-5 text-primary" />
                  Tus reclamos
                </span>
              </CardTitle>
              <CardDescription>
                {pagination.totalItems === 0
                  ? 'No tienes reclamos registrados'
                  : `${pagination.totalItems} reclamo${pagination.totalItems > 1 ? 's' : ''} registrado${pagination.totalItems > 1 ? 's' : ''}`}
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Nuevo reclamo
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <ComplaintsList complaints={complaints} pagination={pagination} />
        </CardContent>
      </Card>

      <ComplaintForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => setShowForm(false)}
        defaultPhone={defaultPhone}
        defaultEmail={defaultEmail}
      />
    </>
  );
}
