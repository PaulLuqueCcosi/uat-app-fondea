'use client';

import { useState } from 'react';
import { Users, Copy, Check, Gift } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Referral, ReferralSummary } from '@/lib/referrals';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReferidosContentProps {
  summary: ReferralSummary;
  referrals: Referral[];
}

export function ReferidosContent({ summary, referrals }: ReferidosContentProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(summary.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(summary.link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Solicita tu préstamo en FONDEA! Usa mi código ${summary.code} y ambos ganamos puntos para el Pasaporte Financiero. ${summary.link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-foreground">{summary.totalReferrals}</p>
            <p className="text-[10px] text-muted-foreground">Amigos referidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-success-700">{summary.completedReferrals}</p>
            <p className="text-[10px] text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-accent-800">{summary.totalPointsEarned}</p>
            <p className="text-[10px] text-muted-foreground">Puntos ganados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{summary.pointsPerReferral}</p>
            <p className="text-[10px] text-muted-foreground">Puntos por referido</p>
          </CardContent>
        </Card>
      </div>

      {/* Código y compartir */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="w-4 h-4 text-accent-800" />
            Tu código de referido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Código */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Código</p>
            <div className="flex items-center gap-2 rounded-lg bg-accent-50 border border-accent-200 px-4 py-3">
              <code className="text-lg font-bold text-accent-900 tracking-wider flex-1">
                {summary.code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-1.5 shrink-0"
              >
                <Copy className={`w-3.5 h-3.5 ${copiedCode ? 'hidden' : ''}`} />
                <Check className={`w-3.5 h-3.5 text-success-600 ${copiedCode ? '' : 'hidden'}`} />
                <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
              </Button>
            </div>
          </div>

          {/* URL */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Enlace de referido</p>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
              <span className="text-xs text-muted-foreground truncate flex-1">
                {summary.link}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5 shrink-0"
              >
                <Copy className={`w-3.5 h-3.5 ${copiedLink ? 'hidden' : ''}`} />
                <Check className={`w-3.5 h-3.5 text-success-600 ${copiedLink ? '' : 'hidden'}`} />
                <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </Button>
            </div>
          </div>

          {/* WhatsApp */}
          <Button
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white"
            onClick={handleShareWhatsApp}
          >
            <WhatsAppIcon className="w-5 h-5" />
            Compartir por WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Lista de referidos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-muted-foreground" />
            Tus referidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aún no tienes referidos. ¡Comparte tu código!
            </p>
          ) : (
            <div className="divide-y divide-border">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-accent-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ref.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(ref.registeredAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ref.pointsEarned > 0 && (
                      <span className="text-xs font-semibold text-accent-800">
                        +{ref.pointsEarned} pts
                      </span>
                    )}
                    <Badge
                      variant={ref.status === 'COMPLETED' ? 'success' : 'warning'}
                      className="text-[9px]"
                    >
                      {ref.status === 'COMPLETED' ? 'Completado' : ref.status === 'ACTIVE' ? 'Activo' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── WhatsApp logo oficial (SVG) ──────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
