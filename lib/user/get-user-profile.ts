import type { UserProfile, UserContact, UserSecurity } from './types';

/**
 * Obtiene los datos de perfil del usuario.
 * HOY: mock. MAÑANA: API/backend.
 */
export async function getUserProfile(): Promise<UserProfile> {
  return {
    firstName: 'Carlos',
    secondName: 'Alberto',
    firstLastName: 'Mendoza',
    secondLastName: 'Quispe',
    dni: '72345678',
    dniVerified: true,
    avatar: null,
    createdAt: '2025-01-10T14:30:00Z',
    lastLogin: '2026-06-03T09:15:00Z',
  };
}

/**
 * Obtiene los datos de contacto del usuario.
 * HOY: mock. MAÑANA: API/backend.
 */
export async function getUserContact(): Promise<UserContact> {
  return {
    email: 'carlos.mendoza@gmail.com',
    emailVerified: true,
    phone: '+51 987 654 321',
    phoneVerified: true,
  };
}

/**
 * Obtiene los datos de seguridad del usuario.
 * HOY: mock. MAÑANA: API/backend.
 */
export async function getUserSecurity(): Promise<UserSecurity> {
  return {
    hasPassword: true,
    linkedAccounts: [
      { provider: 'google', email: 'carlos.mendoza@gmail.com', connectedAt: '2025-01-15' },
    ],
  };
}
