'use server';

import { getProvinces } from 'ubigeo-fns';
import {
  getAdminCities,
  createAdminCity,
  pauseAdminCity,
  activateAdminCity,
  getAdminBusinessHours,
  updateAdminBusinessHours,
  type AdminCityAvailability,
  type CreateCityAvailabilityRequest,
  type CityAvailabilityResult,
  type AdminBusinessHours,
  type UpdateBusinessHoursRequest,
  type BusinessHoursResult,
} from '@/modules/admin/admin-availability.service';
import { getDepartamentosAction } from './additional-address.actions';

export interface ProvinceOption {
  code: string;
  name: string;
  departmentName: string;
}

/**
 * Catálogo completo de provincias del Perú (196), con el nombre del
 * departamento al que pertenece — para el buscador de "Registrar ciudad".
 * Mismo catálogo INEI (ubigeo-fns) que ya usa el formulario de dirección del
 * cliente (AddressShadcn.tsx) — el admin nunca ve ni escribe un código ubigeo.
 */
export async function getAllProvincesAction(): Promise<ProvinceOption[]> {
  const departments = await getDepartamentosAction();
  const all: ProvinceOption[] = [];

  for (const dep of departments) {
    const provinces = getProvinces(dep.value);
    for (const prov of provinces) {
      all.push({ code: prov.code, name: prov.name, departmentName: dep.label });
    }
  }

  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAdminCitiesAction(): Promise<AdminCityAvailability[]> {
  return getAdminCities();
}

export async function createAdminCityAction(request: CreateCityAvailabilityRequest): Promise<CityAvailabilityResult> {
  return createAdminCity(request);
}

export async function pauseAdminCityAction(id: string, reason?: string): Promise<CityAvailabilityResult> {
  return pauseAdminCity(id, reason);
}

export async function activateAdminCityAction(id: string): Promise<CityAvailabilityResult> {
  return activateAdminCity(id);
}

export async function getAdminBusinessHoursAction(): Promise<AdminBusinessHours | null> {
  return getAdminBusinessHours();
}

export async function updateAdminBusinessHoursAction(request: UpdateBusinessHoursRequest): Promise<BusinessHoursResult> {
  return updateAdminBusinessHours(request);
}
