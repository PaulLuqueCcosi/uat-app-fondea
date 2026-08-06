/**
 * Tipos para los datos de autenticación de un usuario — vista admin.
 * Mapea la respuesta del backend de GET /api/v1/admin/users/{userId}/auth,
 * que se obtiene EN VIVO desde el proveedor de identidad (Logto) — no se
 * cachea localmente (ver User.java: "responsabilidad de Logto").
 */

export interface AdminSocialIdentity {
  provider: string;
  email: string | null;
  name: string | null;
}

export interface AdminUserAuth {
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  isSuspended: boolean;
  lastSignInAt: string | null;
  identities: AdminSocialIdentity[];
}
