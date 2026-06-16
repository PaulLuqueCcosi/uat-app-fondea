'use server';

import { requireValidSession } from './auth.actions';
import * as applicationService from '@/modules/applications/application.service';

/**
 * Obtiene todas las solicitudes del usuario.
 * Thin wrapper — valida sesión y delega.
 */
export async function getApplicationsList() {
  await requireValidSession();
  return applicationService.getApplications();
}
