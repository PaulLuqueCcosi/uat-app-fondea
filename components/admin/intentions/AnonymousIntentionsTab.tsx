'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { getAnonymousIntentionsAction } from '@/app/actions/admin-intentions.actions';
import type { AnonymousIntentionsResult, AnonymousIntention } from '@/modules/admin/admin-intentions.service';

interface Props {
  initialData: AnonymousIntentionsResult;
}

export function AnonymousIntentionsTab({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getAnonymousIntentionsAction(page, 10);
      setData(result);
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    startTransition(async () => {
      const result = await getAnonymousIntentionsAction(newPage, 10);
      setData(result);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Intenciones anónimas desde la calculadora del landing
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto relative">
            {isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">ID</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Monto</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Plazo</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Cuotas</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">1er prést.</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Rango</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">IP</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.data.length > 0 ? data.data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{item.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">S/ {Number(item.amount).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs">{item.termDays}d</td>
                    <td className="px-4 py-2.5 text-xs">{item.installmentCount}</td>
                    <td className="px-4 py-2.5 text-xs">{item.isFirstLoan ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-2.5">
                      {item.selectedRangeCode ? (
                        <Badge variant="outline" className="text-[9px]">{item.selectedRangeCode}</Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{item.clientIp ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('es-PE')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Sin intenciones anónimas. ¿El calculator-service está corriendo?
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Paginación simple */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Mostrando {((page - 1) * 10) + 1}–{Math.min(page * 10, data.pagination.total)} de {data.pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
              Anterior
            </Button>
            <span className="text-xs">{page} / {data.pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => handlePageChange(page + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
