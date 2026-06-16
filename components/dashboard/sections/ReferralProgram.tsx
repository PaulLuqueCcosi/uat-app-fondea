'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Copy, Check, MessageCircle, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ReferralSummary } from '@/modules/referrals';

interface ReferralProgramProps {
  summary: ReferralSummary;
}

/**
 * Programa de Referidos — Card compacta para el dashboard.
 * Componente TONTO — recibe datos, solo muestra + maneja clicks locales.
 */
export function ReferralProgram({ summary }: ReferralProgramProps) {
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Referidos
          </span>
        </CardTitle>
        <CardDescription>
          Gana <span className="font-semibold text-accent-700">{summary.pointsPerReferral} puntos</span> por cada amigo
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {/* Código */}
        <div className="flex items-center gap-2 rounded-lg bg-accent-50 border border-accent-200 px-3 py-2.5">
          <code className="text-sm font-bold text-accent-900 tracking-wider flex-1">
            {summary.code}
          </code>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-accent-100 transition-colors"
            title="Copiar código"
          >
            {copied
              ? <Check className="w-4 h-4 text-accent-600" />
              : <Copy className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span><span className="font-semibold text-foreground">{summary.totalReferrals}</span> amigos</span>
          <span>·</span>
          <span><span className="font-semibold text-accent-700">{summary.totalPointsEarned}</span> puntos</span>
        </div>

        {/* WhatsApp */}
        <Button
          size="sm"
          className="w-full gap-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white"
          onClick={handleShareWhatsApp}
        >
          <MessageCircle className="w-4 h-4" />
          Compartir por WhatsApp
        </Button>
      </CardContent>

      <CardFooter>
        <Link
          href="/dashboard/referidos"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Ver detalles
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
