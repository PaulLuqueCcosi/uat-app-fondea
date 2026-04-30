// Re-exporta el tipo compartido para que los componentes no importen desde actions
export type { UbigeoOption } from '@/app/actions/additional-address.actions';

// Tipos para los datos JSON locales
export interface UbigeoDepartamento {
  id: number;
  departamento: string;
  ubigeo: string;
}

export interface UbigeoProvincia {
  id: number;
  provincia: string;
  ubigeo: string;
  departamento_id: number;
}

export interface UbigeoDistrito {
  id: number;
  distrito: string;
  ubigeo: string;
  provincia_id: number;
  departamento_id: number;
}

// Funciones helper para trabajar con ubigeos
export function parseUbigeo(ubigeo: string): { region: string; province: string; district: string } {
  if (ubigeo.length !== 6) {
    throw new Error('UBIGEO debe tener exactamente 6 dígitos');
  }
  
  return {
    region: ubigeo.substring(0, 2),    // RR (primeros 2 dígitos)
    province: ubigeo.substring(0, 4),  // RRPP (primeros 4 dígitos)
    district: ubigeo                   // RRPPDD (todos los 6 dígitos)
  };
}

export function buildUbigeo(region: string, province: string, district: string): string {
  // Validar que los códigos tengan la longitud correcta
  if (region.length !== 2 || province.length !== 4 || district.length !== 6) {
    throw new Error('Códigos UBIGEO inválidos: región (2), provincia (4), distrito (6) dígitos');
  }
  
  // Validar que los códigos sean consistentes
  if (!province.startsWith(region) || !district.startsWith(province)) {
    throw new Error('Códigos UBIGEO inconsistentes: deben ser jerárquicos');
  }
  
  return district;
}
