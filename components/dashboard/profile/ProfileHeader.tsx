'use client';

import { Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/lib/user/types';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const fullName = [profile.firstName, profile.secondName, profile.firstLastName, profile.secondLastName]
    .filter(Boolean)
    .join(' ') || 'Sin nombre';

  const initials = `${(profile.firstName || 'U')[0]}${(profile.firstLastName || '')[0] || ''}`;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer">
            <Avatar className="w-20 h-20 border-4 border-primary/10">
              {profile.avatar && <AvatarImage src={profile.avatar} alt={fullName} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground">{fullName}</p>
            {profile.createdAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Camera className="w-3.5 h-3.5" />
            Cambiar foto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
