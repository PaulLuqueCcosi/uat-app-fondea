'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getDocumentsByCreditIdAction,
  type CreditDocument,
} from '@/app/actions/credit-documents.actions';
import { NO_DOCUMENTS_MESSAGE } from './CreditDocumentsMenu';

/**
 * "Documentos" card of the credit detail page. Uses the same data logic as the
 * dashboard dropdown (credit-documents.actions) and the same empty-state copy.
 */
export function CreditDocumentsSection({ creditId }: { creditId: string }) {
  const [documents, setDocuments] = useState<CreditDocument[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDocumentsByCreditIdAction(creditId)
      .then((docs) => { if (!cancelled) setDocuments(docs); })
      .catch(() => { if (!cancelled) setDocuments([]); });
    return () => { cancelled = true; };
  }, [creditId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Documentos
        </CardTitle>
        <CardDescription>Descarga los documentos firmados de este crédito.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents === null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando documentos...
          </div>
        )}

        {documents?.length === 0 && (
          <p className="text-sm text-muted-foreground">{NO_DOCUMENTS_MESSAGE}</p>
        )}

        {documents?.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{doc.label}</span>
            </div>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" download className="shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Descargar PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
