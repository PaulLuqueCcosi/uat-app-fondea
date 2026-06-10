/**
 * Acciones del módulo de usuario.
 * Funciones para modificar datos del perfil.
 *
 * HOY: simulan latencia.
 * MAÑANA: llaman al Account API de Logto / backend.
 */

export async function updateEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
  // TODO: implementar flujo Logto (verificar identidad → enviar código → confirmar)
  await new Promise((r) => setTimeout(r, 1000));
  return { success: true };
}

export async function updatePhone(newPhone: string): Promise<{ success: boolean; error?: string }> {
  // TODO: implementar flujo Logto (verificar identidad → enviar SMS → confirmar)
  await new Promise((r) => setTimeout(r, 1000));
  return { success: true };
}

export async function updateAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  // TODO: subir a S3/Supabase storage y actualizar perfil
  await new Promise((r) => setTimeout(r, 1000));
  return { success: true, url: '' };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  // TODO: verificar identidad + cambiar contraseña via Account API
  await new Promise((r) => setTimeout(r, 1000));
  return { success: true };
}

export async function unlinkGoogle(): Promise<{ success: boolean; error?: string }> {
  // TODO: verificar identidad + desvincular via Account API
  await new Promise((r) => setTimeout(r, 1000));
  return { success: true };
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  // TODO: verificar identidad + eliminar cuenta
  await new Promise((r) => setTimeout(r, 1000));
  return { success: true };
}
