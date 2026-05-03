import { signIn } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

/**
 * GET /api/logto/sign-in
 *
 * Route handler dedicado para iniciar el flujo de autenticación con Logto.
 * Debe ser un route handler (no RSC) porque signIn() modifica cookies.
 *
 * El middleware y los layouts redirigen aquí cuando detectan sesión inválida.
 */
export async function GET() {
  await signIn(logtoConfig);
}
