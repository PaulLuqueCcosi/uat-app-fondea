/**
 * Tipos del módulo de Usuario.
 * Centraliza las interfaces de perfil, contacto y seguridad.
 */

// ─── Perfil ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  firstName: string | null;
  secondName: string | null;
  firstLastName: string | null;
  secondLastName: string | null;
  dni: string | null;
  dniVerified: boolean;
  avatar: string | null;
  createdAt: string | null;
  lastLogin: string | null;
}

// ─── Contacto ─────────────────────────────────────────────────────────────────

export interface UserContact {
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
}

// ─── Seguridad ────────────────────────────────────────────────────────────────

export interface LinkedAccount {
  provider: string;
  email: string;
  connectedAt: string;
}

export interface UserSecurity {
  hasPassword: boolean;
  linkedAccounts: LinkedAccount[];
}
