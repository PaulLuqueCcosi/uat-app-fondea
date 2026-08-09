'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumnDef, type DataTablePagination } from '@/components/admin/DataTable';
import { ConfirmAction } from '@/components/admin/shared/ConfirmAction';
import { CheckCircle2, CircleDashed, RotateCcw } from 'lucide-react';
import type { UserNpsSurveyItem } from '@/modules/admin/admin-nps.service';
import { requestNpsResubmissionAction } from '@/app/actions/admin-nps.actions';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function scoreVariant(score: number): 'success' | 'warning' | 'error' {
  if (score >= 9) return 'success';
  if (score >= 7) return 'warning';
  return 'error';
}

const columns: DataTableColumnDef<UserNpsSurveyItem>[] = [
  {
    accessorKey: 'score',
    header: 'Puntaje',
    cell: ({ row }) => (
      <Badge variant={scoreVariant(row.original.score)} className="font-mono">
        {row.original.score}/10
      </Badge>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>,
  },
];

interface UserNpsTabProps {
  userId: string;
  surveys: UserNpsSurveyItem[];
  pagination: DataTablePagination;
}

export function UserNpsTab({ userId, surveys, pagination }: UserNpsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      router.push(`/admin/users/${userId}/nps?${params.toString()}`);
    },
    [router, userId],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('size', String(newSize));
      params.set('page', '1');
      updateUrl(params);
    },
    [searchParams, updateUrl],
  );

  const handleRequestAgain = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await requestNpsResubmissionAction(userId);
      if (!result.ok) {
        setMessage({ type: 'error', text: result.message ?? 'No se pudo enviar el pedido.' });
        return;
      }
      setMessage({ type: 'success', text: 'Listo — la próxima vez que el usuario entre al dashboard, se le volverá a mostrar la encuesta.' });
    });
  };

  const hasResponded = pagination.totalItems > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {hasResponded ? (
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ya respondió
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5">
            <CircleDashed className="h-3.5 w-3.5" />
            Sin respuesta aún
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={isPending}
          onClick={() => setShowConfirm(true)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Pedir que vuelva a responder
        </Button>
      </div>

      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-success-700' : 'text-destructive'}`}>
          {message.text}
        </p>
      )}

      {hasResponded ? (
        <DataTable
          columns={columns}
          data={surveys}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          enableExport={false}
        />
      ) : (
        <p className="text-sm text-muted-foreground italic py-6 text-center">
          Este usuario todavía no respondió ninguna encuesta NPS.
        </p>
      )}

      <ConfirmAction
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="¿Pedir que vuelva a responder NPS?"
        description="El usuario puede responder varias veces sin problema — esto solo hace que se le vuelva a mostrar el popup de la encuesta la próxima vez que entre al dashboard, aunque ya haya respondido antes."
        confirmLabel="Pedir de nuevo"
        onConfirm={handleRequestAgain}
      />
    </div>
  );
}
