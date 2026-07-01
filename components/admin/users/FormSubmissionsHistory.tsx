'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FormSubmission } from '@/modules/admin';

interface FormSubmissionsHistoryProps {
  submissions: FormSubmission[];
}

export function FormSubmissionsHistory({ submissions }: FormSubmissionsHistoryProps) {
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historial de envíos ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Resultado</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Motivo rechazo</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Datos</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleString('es-PE')}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={sub.verificationResult === 'APPROVED' ? 'success' : 'error'} className="text-[9px]">
                        {sub.verificationResult}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">
                      {sub.rejectionReason || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setViewingSubmission(sub)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Datos del envío
              {viewingSubmission && (
                <span className="ml-2">
                  <Badge
                    variant={viewingSubmission.verificationResult === 'APPROVED' ? 'success' : 'error'}
                    className="text-[10px]"
                  >
                    {viewingSubmission.verificationResult}
                  </Badge>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {viewingSubmission && (
            <div className="space-y-4">
              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Enviado: {new Date(viewingSubmission.submittedAt).toLocaleString('es-PE')}</span>
                <span>ID: {viewingSubmission.id}</span>
              </div>

              {/* Motivo de rechazo */}
              {viewingSubmission.rejectionReason && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">Motivo de rechazo:</p>
                  <p className="text-sm text-foreground mt-0.5">{viewingSubmission.rejectionReason}</p>
                </div>
              )}

              {/* Datos */}
              <div className="rounded-lg border p-4 space-y-3">
                {Object.entries(viewingSubmission.submissionData).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <span className="text-xs text-muted-foreground shrink-0 min-w-[120px]">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
