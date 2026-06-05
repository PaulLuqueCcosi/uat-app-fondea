'use client';

import { useCreditScoreStore } from '@/lib/stores/credit-score-store';
import { TrendingUp } from 'lucide-react';

export function HeaderScore() {
  const status = useCreditScoreStore(s => s.status);
  const creditScore = useCreditScoreStore(s => s.creditScore);
  const scoreRanges = useCreditScoreStore(s => s.scoreRanges);

  if (status !== 'success' || !creditScore || !scoreRanges?.length) {
    return null;
  }

  const range = scoreRanges.find(r => creditScore.score >= r.minScore && creditScore.score <= r.maxScore);
  if (!range) return null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border bg-white shadow-sm" style={{ borderColor: `${range.color}30` }}>
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: range.color }} />
      <span className="text-xs font-medium" style={{ color: range.color }}>
        Score: {range.label}
      </span>
      <TrendingUp className="w-3.5 h-3.5" style={{ color: range.color }} />
    </div>
  );
}
