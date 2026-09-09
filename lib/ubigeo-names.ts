import { getDepartments, getProvinces, getDistricts } from 'ubigeo-fns';

/** Resuelve un código ubigeo (INEI) a su nombre legible. '—' si no hay código o no matchea. */
export function resolveUbigeoName(
  type: 'department' | 'province' | 'district',
  code: string | undefined | null
): string {
  if (!code) return '—';
  try {
    if (type === 'department') {
      const deps = getDepartments();
      return deps.find((d) => d.code === code)?.name ?? code;
    }
    if (type === 'province') {
      const regionCode = code.substring(0, 2);
      const provs = getProvinces(regionCode);
      return provs.find((p) => p.code === code)?.name ?? code;
    }
    if (type === 'district') {
      const provCode = code.substring(0, 4);
      const dists = getDistricts(provCode);
      return dists.find((d) => d.code === code)?.name ?? code;
    }
  } catch {
    return code;
  }
  return code;
}
