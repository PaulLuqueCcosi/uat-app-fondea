'use client';

import { useState } from 'react';
import { FileCheck2, Eye, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CERTIFICATE_STATUS_LABELS,
  DELIVERY_STATUS_LABELS,
  type CertificateDeliveryStatus,
  type CertificateStatus,
  type PayoffCertificate,
} from '@/modules/admin/admin-constancias.types';

const STATUS_VARIANT: Record<CertificateStatus, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  ISSUED: 'default',
  FAILED: 'destructive',
};

const DELIVERY_VARIANT: Record<CertificateDeliveryStatus, 'default' | 'secondary' | 'destructive'> = {
  NOT_SENT: 'secondary',
  SENT: 'default',
  DELIVERY_FAILED: 'destructive',
};

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  /** El crédito solo puede tener a lo sumo una constancia — ver PayoffCertificate. */
  certificate: PayoffCertificate | null;
}

/**
 * Muestra si el crédito liquidado (PAID_OFF) ya tiene su Constancia de No Adeudo emitida y
 * si se le notificó al cliente. Vive en la pestaña "Resumen" del detalle de crédito admin,
 * junto a la sección de auditoría/timeline que ya registra el evento CREDIT_CLOSED.
 */
export function CreditCertificateCard({ certificate }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState<'preview' | 'download' | null>(null);

  const fetchPdfUrl = async (id: string) => {
    const res = await fetch(`/api/admin/constancias/${id}/pdf`);
    if (!res.ok) {
      toast.error('El PDF todavía no está disponible para esta constancia.');
      return null;
    }
    const { pdfUrl } = await res.json();
    return pdfUrl as string;
  };

  const handlePreview = async () => {
    if (!certificate) return;
    setLoading('preview');
    const url = await fetchPdfUrl(certificate.id);
    setLoading(null);
    if (url) {
      setPreviewUrl(url);
      setPreviewOpen(true);
    }
  };

  const handleDownload = async () => {
    if (!certificate) return;
    setLoading('download');
    const url = await fetchPdfUrl(certificate.id);
    setLoading(null);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!certificate) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" /> Constancia de No Adeudo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Este crédito todavía no tiene una constancia asociada. Se emite automáticamente
            al liquidarse por completo (solo créditos STANDARD).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" /> Constancia de No Adeudo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {certificate.certificateCode}
            </span>
            <Badge variant={STATUS_VARIANT[certificate.status]} className="text-[10px]">
              {CERTIFICATE_STATUS_LABELS[certificate.status]}
            </Badge>
            <Badge variant={DELIVERY_VARIANT[certificate.deliveryStatus]} className="text-[10px]">
              {DELIVERY_STATUS_LABELS[certificate.deliveryStatus]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Emitida</p>
              <p className="font-medium">{formatDateTime(certificate.issuedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Enviada al cliente</p>
              <p className="font-medium">{formatDateTime(certificate.sentAt)}</p>
            </div>
          </div>

          {certificate.status === 'FAILED' && certificate.failureReason && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-error-50 border border-error-100">
              <AlertCircle className="h-3.5 w-3.5 text-error-600 shrink-0 mt-0.5" />
              <p className="text-xs text-error-700">{certificate.failureReason}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5"
              disabled={!certificate.downloadable || loading !== null}
              onClick={handlePreview}
            >
              {loading === 'preview' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              Ver PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5"
              disabled={!certificate.downloadable || loading !== null}
              onClick={handleDownload}
            >
              {loading === 'download' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Descargar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={(open) => { setPreviewOpen(open); if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-3xl sm:max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b">
            <DialogTitle className="flex items-center justify-between gap-2 pr-6">
              <span className="font-mono text-sm">{certificate.certificateCode}</span>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir en pestaña nueva
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {previewUrl && (
              <iframe src={previewUrl} title="Vista previa de constancia" className="w-full h-full border-0" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
