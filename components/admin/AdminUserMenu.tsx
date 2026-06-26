'use client';

import { useState, useTransition } from 'react';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AdminUserMenuProps {
  user: { name: string; email?: string; avatar?: string | null };
  onSignOut: () => Promise<void>;
}

export function AdminUserMenu({ user, onSignOut }: AdminUserMenuProps) {
  const [isPending, startTransition] = useTransition();

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  const handleSignOut = () => {
    startTransition(async () => {
      await onSignOut();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-neutral-800 p-1 pr-3 transition-colors outline-none">
        <Avatar className="h-8 w-8">
          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          <AvatarFallback className="bg-primary text-white text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-neutral-300 hidden sm:block">{user.name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-error-600 focus:text-error-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isPending ? 'Cerrando...' : 'Cerrar sesión'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
