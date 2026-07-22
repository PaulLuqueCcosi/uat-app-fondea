'use client';

import { ScoreRangesEditor } from './ScoreRangesEditor';
import { AmountsTermsEditor } from './AmountsTermsEditor';
import type { AvailabilityConfig } from '@/modules/admin/calculator-admin.service';

interface Props {
  data: AvailabilityConfig;
  onChange: (data: AvailabilityConfig) => void;
  readonly: boolean;
}

export function AvailabilityEditor({ data, onChange, readonly }: Props) {
  const scoreRanges = data.scoreRanges ?? [];
  const availability = data.availability ?? [];

  return (
    <div className="space-y-6">
      <ScoreRangesEditor
        scoreRanges={scoreRanges}
        onChange={(updated) => onChange({ ...data, scoreRanges: updated })}
        readonly={readonly}
      />

      <AmountsTermsEditor
        availability={availability}
        onChange={(updated) => onChange({ ...data, availability: updated })}
        readonly={readonly}
      />
    </div>
  );
}
