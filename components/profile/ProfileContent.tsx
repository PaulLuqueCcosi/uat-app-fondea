'use client';

import { Mail, Phone, CreditCard, MessageCircle } from 'lucide-react';
import { ProfileHeader } from './ProfileHeader';
import { ProfileField } from './ProfileField';
import { EditEmailDialog } from './EditEmailDialog';
import { EditPhoneDialog } from './EditPhoneDialog';
import { SecuritySection } from './SecuritySection';
import type { UserProfile, UserContact, UserSecurity } from '@/modules/profile';

interface ProfileContentProps {
  profile: UserProfile;
  contact: UserContact;
  security: UserSecurity;
}

export function ProfileContent({ profile, contact, security }: ProfileContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═══ COLUMNA IZQUIERDA: Perfil ═══ */}
      <div className="space-y-4">
        <ProfileHeader profile={profile} />

        <ProfileField
          icon={<CreditCard className="w-4 h-4 text-primary" />}
          label="Documento de identidad"
          value={`DNI ${profile.dni || '—'}`}
          footer={
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              Para cambiar tu DNI,{' '}
              <a
                href="https://wa.me/51999999999?text=Hola%2C%20necesito%20solicitar%20un%20cambio%20de%20DNI%20en%20mi%20cuenta%20FONDEA."
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                contacta a soporte
              </a>.
            </span>
          }
        />

        <ProfileField
          icon={<Mail className="w-4 h-4 text-primary" />}
          label="Correo electrónico"
          value={contact.email || 'Sin correo registrado'}
          action={<EditEmailDialog currentEmail={contact.email || ''} hasPassword={security.hasPassword} mode={contact.email ? 'edit' : 'add'} />}
        />

        <ProfileField
          icon={<Phone className="w-4 h-4 text-primary" />}
          label="Número de celular"
          value={contact.phone || 'Sin número registrado'}
          action={<EditPhoneDialog currentPhone={contact.phone || ''} mode={contact.phone ? 'edit' : 'add'} />}
        />
      </div>

      {/* ═══ COLUMNA DERECHA: Seguridad ═══ */}
      <SecuritySection security={security} />
    </div>
  );
}
