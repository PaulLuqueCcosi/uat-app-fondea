'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface NpsCardProps {
  nps: {
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    npsScore: number;
  };
}

export function NpsCard({ nps }: NpsCardProps) {
  const score = nps.npsScore;
  const colorClass = score > 50 ? 'text-emerald-600' : score >= 30 ? 'text-amber-500' : 'text-red-500';
  const bgClass = score > 50 ? 'bg-emerald-50' : score >= 30 ? 'bg-amber-50' : 'bg-red-50';

  const TrendIcon = score > 0 ? ArrowUpRight : score < 0 ? ArrowDownRight : Minus;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          NPS
        </CardTitle>
        <div className={`rounded-full p-1 ${bgClass}`}>
          <TrendIcon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorClass}`}>{Math.round(score)}</div>
        <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
          <div>
            <span className="font-medium text-emerald-600">{nps.promoters}</span> Promotores
          </div>
          <div>
            <span className="font-medium text-amber-500">{nps.passives}</span> Pasivos
          </div>
          <div>
            <span className="font-medium text-red-500">{nps.detractors}</span> Detractores
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {nps.totalResponses.toLocaleString()} respuestas
        </p>
      </CardContent>
    </Card>
  );
}
