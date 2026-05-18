'use client';

import React from 'react';
import { Button } from './button';

interface StickyBottomBarProps {
  ctaLabel: string;
  onCta: () => void;
  loading?: boolean;
  ctaDisabled?: boolean;
  showAutosave?: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  ctaLabel,
  onCta,
  loading = false,
  ctaDisabled = false,
  showAutosave = true,
}) => {
  return (
    <div className="sticky bottom-0 bg-card border-t border-border px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 flex items-center justify-between z-30 gap-3">
      {showAutosave ? (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-secondary inline-block flex-shrink-0" />
          <span className="hidden sm:inline">Guardado automáticamente</span>
          <span className="sm:hidden">Guardado</span>
        </div>
      ) : (
        <div />
      )}
      <Button
        onClick={onCta}
        disabled={ctaDisabled || loading}
        className="flex-shrink-0"
      >
        {ctaLabel}
      </Button>
    </div>
  );
};
