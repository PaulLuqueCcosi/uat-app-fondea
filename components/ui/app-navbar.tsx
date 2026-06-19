'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { UserMenuDropdown } from '@/components/ui/user-menu-dropdown';
import type { User as UserType } from '@/lib/types';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AppNavbarProps {
  user: UserType;
  onSignOut: () => Promise<void>;
  /**
   * Cuando se pasa, muestra "← Volver" a la izquierda del logo.
   */
  backLink?: {
    href: string;
    label?: string;
  };
  /**
   * Slot para contenido entre el logo y el usuario.
   * En el dashboard se usa para el SidebarTrigger + breadcrumb.
   */
  centerContent?: React.ReactNode;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AppNavbar({ user, onSignOut, backLink, centerContent }: AppNavbarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 md:px-6">

        {/* ── Izquierda: logo + back (opcional) ── */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center">
            <Logo height={28} />
          </Link>

          {backLink && (
            <>
              <div className="h-5 w-px bg-border" />
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </>
          )}
        </div>

        {/* ── Centro: contenido opcional (breadcrumb, etc.) ── */}
        {centerContent && (
          <div className="flex-1 flex items-center px-4">
            {centerContent}
          </div>
        )}

        {/* ── Derecha: menú de usuario ── */}
        <div className="flex items-center gap-1">
          <UserMenuDropdown user={user} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}
