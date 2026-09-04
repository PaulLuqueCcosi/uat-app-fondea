'use server';

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
