/**
 * Tipos del dominio Perfil de Usuario.
 *
 * Contrato entre la data source (hoy Logto claims, mañana backend)
 * y los componentes. Si cambias la fuente, estos tipos no se tocan.
 */

// ─── Perfil ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  firstName: string | null;
  secondName: string | null;
  firstLastName: string | null;
  secondLastName: string | null;
  documentType: string | null;  // 'dni', 'ce', 'pasaporte', etc.
  documentNumber: string | null;
  documentVerified: boolean;
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

// ─── Perfil Completo (lo que usa la profile page) ─────────────────────────────

export interface FullUserProfile {
  profile: UserProfile;
  contact: UserContact;
  security: UserSecurity;
}

// ─── Resumen (lo que usa el navbar) ───────────────────────────────────────────

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  dni: string | null;
}

// ─── Resultado de acciones de mutación ────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  error?: string;
}
