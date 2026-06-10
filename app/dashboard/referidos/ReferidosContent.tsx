'use client';

import { useState } from 'react';
import { Users, Copy, Check, MessageCircle, Gift } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="flex items-center gap-2 rounded-lg bg-accent-50 border border-accent-200 px-4 py-3">
            <code className="text-lg font-bold text-accent-900 tracking-wider flex-1">
              {summary.code}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          <Button
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white"
            onClick={handleShareWhatsApp}
          >
            <MessageCircle className="w-4 h-4" />
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
