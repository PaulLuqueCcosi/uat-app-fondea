'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, User, LogOut, Settings, ChevronDown, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import type { User as UserType } from '@/lib/types';

interface DashboardNavbarProps {
  user: UserType;
  onSignOut: () => Promise<void>;
}

export function DashboardNavbar({ user, onSignOut }: DashboardNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await onSignOut();
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-40 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo />
        </Link>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-fondea-text hover:text-dark transition-colors rounded-lg hover:bg-muted/50">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          </button>

          <div className="relative flex items-center gap-3 pl-4 border-l border-border" ref={dropdownRef}>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-dark">{user.name}</p>
              <p className="text-xs text-fondea-text truncate max-w-[150px]">{user.email || user.phone}</p>
            </div>

            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative group flex items-center gap-2 p-1 rounded-full hover:bg-muted/50 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                <User className="w-5 h-5 text-white" />
              </div>
              <ChevronDown className={`w-4 h-4 text-fondea-text transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
                  <p className="text-sm font-semibold text-dark truncate">{user.name}</p>
                  <p className="text-xs text-fondea-text truncate">{user.email || user.phone}</p>
                </div>
                <div className="py-2">
                  <Link
                    href="/dashboard/perfil"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      pathname === '/dashboard/perfil'
                        ? 'bg-primary-50 text-primary font-semibold'
                        : 'text-dark hover:bg-background hover:text-primary'
                    }`}
                  >
                    <User className={`w-4 h-4 ${pathname === '/dashboard/perfil' ? 'text-primary' : 'text-fondea-text'}`} />
                    Mi Perfil
                  </Link>
                  <Link
                    href="/dashboard/configuracion"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      pathname === '/dashboard/configuracion'
                        ? 'bg-primary-50 text-primary font-semibold'
                        : 'text-dark hover:bg-background hover:text-primary'
                    }`}
                  >
                    <Settings className={`w-4 h-4 ${pathname === '/dashboard/configuracion' ? 'text-primary' : 'text-fondea-text'}`} />
                    Configuración
                  </Link>
                </div>
                <div className="py-2 border-t border-border/50">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
