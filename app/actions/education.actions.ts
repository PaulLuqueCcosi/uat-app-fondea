'use server';

import { requireValidSession } from './auth.actions';
import * as educationService from '@/modules/education/education.service';

/** Resúmenes de los módulos de "Fondea Aprende" (listado/grid) */
export async function getEducationModules() {
  await requireValidSession();
  return educationService.getModuleSummaries();
}

/** Detalle completo de un módulo */
export async function getEducationModule(id: string) {
  await requireValidSession();
  return educationService.getModuleById(id);
}

/** Registra que el usuario abrió un módulo (dispara el KPI de acceso — M10) */
export async function recordEducationModuleAccess(id: string) {
  await requireValidSession();
  return educationService.recordModuleAccess(id);
}
