'use server';

import departamentosRaw from '@/lib/ubigeo_departamentos.json';
import provinciasRaw from '@/lib/ubigeo_provincias.json';
import distritosRaw from '@/lib/ubigeo_distritos.json';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Departamento {
  id: number;
  departamento: string;
  ubigeo: string;
}

interface Provincia {
  id: number;
  provincia: string;
  ubigeo: string;
  departamento_id: number;
}

interface Distrito {
  id: number;
  distrito: string;
  ubigeo: string;
  provincia_id: number;
  departamento_id: number;
}

const departamentos = (departamentosRaw as { ubigeo_departamentos: Departamento[] }).ubigeo_departamentos;
const provincias    = (provinciasRaw    as { ubigeo_provincias:    Provincia[]    }).ubigeo_provincias;
const distritos     = (distritosRaw     as { ubigeo_distritos:     Distrito[]     }).ubigeo_distritos;

// ── Helpers ───────────────────────────────────────────────────────────────────

export interface UbigeoOption {
  value: string;  // id como string
  label: string;  // nombre en Title Case
  ubigeo: string; // código INEI
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Server Actions ────────────────────────────────────────────────────────────

/**
 * Retorna todos los departamentos del Perú.
 * TODO: cuando el backend esté listo, reemplazar el cuerpo por:
 *   const res = await fetch(`${process.env.API_URL}/ubigeo/departamentos`);
 *   return res.json();
 */
export async function getDepartamentosAction(): Promise<UbigeoOption[]> {
  return departamentos
    .map((d) => ({ value: String(d.id), label: toTitleCase(d.departamento), ubigeo: d.ubigeo }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Retorna las provincias de un departamento.
 * @param departamentoId  id del departamento (string)
 * TODO: cuando el backend esté listo, reemplazar el cuerpo por:
 *   const res = await fetch(`${process.env.API_URL}/ubigeo/provincias?departamento_id=${departamentoId}`);
 *   return res.json();
 */
export async function getProvinciasAction(departamentoId: string): Promise<UbigeoOption[]> {
  if (!departamentoId) return [];
  const id = Number(departamentoId);
  return provincias
    .filter((p) => p.departamento_id === id)
    .map((p) => ({ value: String(p.id), label: toTitleCase(p.provincia), ubigeo: p.ubigeo }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Retorna los distritos de una provincia.
 * @param provinciaId  id de la provincia (string)
 * TODO: cuando el backend esté listo, reemplazar el cuerpo por:
 *   const res = await fetch(`${process.env.API_URL}/ubigeo/distritos?provincia_id=${provinciaId}`);
 *   return res.json();
 */
export async function getDistritosAction(provinciaId: string): Promise<UbigeoOption[]> {
  if (!provinciaId) return [];
  const id = Number(provinciaId);
  return distritos
    .filter((d) => d.provincia_id === id)
    .map((d) => ({ value: String(d.id), label: toTitleCase(d.distrito), ubigeo: d.ubigeo }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
