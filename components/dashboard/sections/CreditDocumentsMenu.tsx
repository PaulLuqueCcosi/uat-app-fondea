'use client';

import { useState } from 'react';
import { ChevronDown, Download, FileText, Loader2, ScrollText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  getCreditDocumentsAction,
  type CreditDocument,
  type CreditDocumentsSource,
} from '@/app/actions/credit-documents.actions';

export const NO_DOCUMENTS_MESSAGE = 'Aún no hay documentos disponibles para descargar.';

interface CreditDocumentsMenuProps extends CreditDocumentsSource {
  /** Trigger label, e.g. "Contrato" or "Acuerdo de refinanciamiento". */
  label: string;
}

/**
 * Dropdown with the downloadable documents of ONE credit.
 *
 * Documents are resolved when the menu opens (not at page load): the PDF links are
 * presigned and short-lived, and most users never open the menu.
 */
export function CreditDocumentsMenu({ label, applicationId, negotiationOfferId }: CreditDocumentsMenuProps) {
  const [documents, setDocuments] = useState<CreditDocument[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (!open) return;
    setLoading(true);
    try {
      setDocuments(await getCreditDocumentsAction({ applicationId, negotiationOfferId }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-sm font-medium text-primary hover:bg-primary/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Documentos del crédito: ${label}`}
      >
        <ScrollText className="w-4 h-4" />
        {label}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-auto min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Documentos de este crédito</DropdownMenuLabel>
        </DropdownMenuGroup>

        {loading && (
          <div className="flex items-center gap-2 px-1.5 py-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando documentos...
          </div>
        )}

        {!loading && documents?.length === 0 && (
          <p className="px-1.5 py-2 text-sm text-muted-foreground">
            {NO_DOCUMENTS_MESSAGE}
          </p>
        )}

        {!loading &&
          documents?.map((doc) => (
            <DropdownMenuItem
              key={doc.id}
              className="cursor-pointer"
              render={<a href={doc.url} target="_blank" rel="noopener noreferrer" download />}
            >
              <FileText className="text-primary" />
              <span className="flex-1">{doc.label}</span>
              <Download className="text-muted-foreground" />
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
