'use server';

import departamentosRaw from '@/lib/ubigeo_departamentos.json';
import provinciasRaw    from '@/lib/ubigeo_provincias.json';
import distritosRaw     from '@/lib/ubigeo_distritos.json';

// ── Tipos internos de ubigeo ──────────────────────────────────────────────────

interface DepRow { id: number; departamento: string; ubigeo: string; }
interface ProvRow { id: number; provincia: string; ubigeo: string; departamento_id: number; }
interface DistRow { id: number; distrito: string; ubigeo: string; provincia_id: number; departamento_id: number; }

const DEPS  = (departamentosRaw as { ubigeo_departamentos: DepRow[]  }).ubigeo_departamentos;
const PROVS = (provinciasRaw    as { ubigeo_provincias:    ProvRow[] }).ubigeo_provincias;
const DISTS = (distritosRaw     as { ubigeo_distritos:     DistRow[] }).ubigeo_distritos;

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface AddressSuggestion {
  place_id: string;
  description: string;    // texto completo para el input
  main_text: string;      // calle/avenida (parte principal)
  secondary_text: string; // distrito, ciudad, país (parte secundaria)
}

/**
 * Resultado normalizado que devuelve getAddressDetailAction.
 * Contiene tanto el texto libre de Google como los IDs de ubigeo
 * que se pudieron resolver por matching de nombre.
 */
export interface AddressDetail {
  place_id: string;
  formatted_address: string;
  street: string;           // calle + número

  // Nombres tal como los devuelve Google (texto libre)
  google_district:    string;
  google_province:    string;
  google_department:  string;

  // IDs resueltos contra los JSONs de ubigeo (null si no se encontró match)
  matched_departamento_id:   string | null;
  matched_departamento_name: string | null;
  matched_provincia_id:      string | null;
  matched_provincia_name:    string | null;
  matched_distrito_id:       string | null;
  matched_distrito_name:     string | null;

  lat?: number;
  lng?: number;
}

// ── Tipos de la respuesta cruda de Google ─────────────────────────────────────

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceDetailsResult {
  formatted_address: string;
  address_components: GoogleAddressComponent[];
  geometry?: { location: { lat: number; lng: number } };
}

// ── Helpers de matching ───────────────────────────────────────────────────────

/** Normaliza un string: minúsculas, sin tildes, sin "provincia de " / "region " */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita tildes
    .replace(/^(provincia de |region de |region )/i, '')
    .trim();
}

/** Extrae el valor de un address_component por tipo */
function getComponent(components: GoogleAddressComponent[], ...types: string[]): string {
  for (const type of types) {
    const c = components.find((c) => c.types.includes(type));
    if (c) return c.long_name;
  }
  return '';
}

/** Busca el departamento más parecido en los JSONs */
function matchDepartamento(googleName: string): DepRow | null {
  const norm = normalize(googleName);
  return DEPS.find((d) => normalize(d.departamento) === norm) ?? null;
}

/** Busca la provincia más parecida dentro de un departamento */
function matchProvincia(googleName: string, departamentoId: number): ProvRow | null {
  const norm = normalize(googleName);
  const candidates = PROVS.filter((p) => p.departamento_id === departamentoId);
  return candidates.find((p) => normalize(p.provincia) === norm) ?? null;
}

/** Busca el distrito más parecido dentro de una provincia */
function matchDistrito(googleName: string, provinciaId: number): DistRow | null {
  const norm = normalize(googleName);
  const candidates = DISTS.filter((d) => d.provincia_id === provinciaId);
  return candidates.find((d) => normalize(d.distrito) === norm) ?? null;
}

/** Convierte el resultado crudo de Google en AddressDetail con ubigeo resuelto */
function mapGoogleToAddressDetail(
  placeId: string,
  result: GooglePlaceDetailsResult,
): AddressDetail {
  const c = result.address_components;

  // Extraer componentes según la jerarquía peruana:
  // Departamento → administrative_area_level_1
  // Provincia    → administrative_area_level_2  (viene como "Provincia de Lima")
  // Distrito     → sublocality_level_1 > locality > administrative_area_level_3
  const streetNumber = getComponent(c, 'street_number');
  const route        = getComponent(c, 'route');
  const street       = [route, streetNumber].filter(Boolean).join(' ');

  const googleDepartment = getComponent(c, 'administrative_area_level_1');
  const googleProvince   = getComponent(c, 'administrative_area_level_2');
  const googleDistrict   = getComponent(c,
    'sublocality_level_1',
    'locality',
    'administrative_area_level_3',
  );

  // Matching en cascada: dep → prov → dist
  const depRow  = matchDepartamento(googleDepartment);
  const provRow = depRow  ? matchProvincia(googleProvince, depRow.id)   : null;
  const distRow = provRow ? matchDistrito(googleDistrict, provRow.id)   : null;

  return {
    place_id: placeId,
    formatted_address: result.formatted_address,
    street,

    google_district:   googleDistrict,
    google_province:   googleProvince,
    google_department: googleDepartment,

    matched_departamento_id:   depRow  ? String(depRow.id)   : null,
    matched_departamento_name: depRow  ? depRow.departamento  : null,
    matched_provincia_id:      provRow ? String(provRow.id)  : null,
    matched_provincia_name:    provRow ? provRow.provincia    : null,
    matched_distrito_id:       distRow ? String(distRow.id)  : null,
    matched_distrito_name:     distRow ? distRow.distrito     : null,

    lat: result.geometry?.location.lat,
    lng: result.geometry?.location.lng,
  };
}

// ── Mock data (se usa mientras no haya API key) ───────────────────────────────

const MOCK_SUGGESTIONS: AddressSuggestion[] = [
  { place_id: 'mock_1', description: 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú',    main_text: 'Av. Javier Prado Este 1234', secondary_text: 'San Isidro, Lima, Perú'    },
  { place_id: 'mock_2', description: 'Av. Larco 456, Miraflores, Lima, Perú',                 main_text: 'Av. Larco 456',              secondary_text: 'Miraflores, Lima, Perú'   },
  { place_id: 'mock_3', description: 'Jr. de la Unión 789, Cercado de Lima, Lima, Perú',      main_text: 'Jr. de la Unión 789',        secondary_text: 'Cercado de Lima, Lima, Perú' },
  { place_id: 'mock_4', description: 'Calle Los Pinos 321, Santiago de Surco, Lima, Perú',    main_text: 'Calle Los Pinos 321',        secondary_text: 'Santiago de Surco, Lima, Perú' },
  { place_id: 'mock_5', description: 'Av. Arequipa 2500, Lince, Lima, Perú',                  main_text: 'Av. Arequipa 2500',          secondary_text: 'Lince, Lima, Perú'        },
  { place_id: 'mock_6', description: 'Av. Ejército 1100, Miraflores, Lima, Perú',             main_text: 'Av. Ejército 1100',          secondary_text: 'Miraflores, Lima, Perú'   },
  { place_id: 'mock_7', description: 'Calle Schell 130, Miraflores, Lima, Perú',              main_text: 'Calle Schell 130',           secondary_text: 'Miraflores, Lima, Perú'   },
  { place_id: 'mock_8', description: 'Av. Benavides 3456, Santiago de Surco, Lima, Perú',     main_text: 'Av. Benavides 3456',         secondary_text: 'Santiago de Surco, Lima, Perú' },
  { place_id: 'mock_9', description: 'Av. Pardo 640, Miraflores, Lima, Perú',                 main_text: 'Av. Pardo 640',              secondary_text: 'Miraflores, Lima, Perú'   },
  { place_id: 'mock_10', description: 'Calle Independencia 200, Arequipa, Arequipa, Perú',    main_text: 'Calle Independencia 200',    secondary_text: 'Arequipa, Arequipa, Perú' },
  { place_id: 'mock_11', description: 'Av. El Sol 123, Cusco, Cusco, Perú',                   main_text: 'Av. El Sol 123',             secondary_text: 'Cusco, Cusco, Perú'       },
  { place_id: 'mock_12', description: 'Jr. Puno 456, Trujillo, La Libertad, Perú',            main_text: 'Jr. Puno 456',               secondary_text: 'Trujillo, La Libertad, Perú' },
];

// Simula lo que devolvería Google Places Details para cada mock
const MOCK_GOOGLE_RESULTS: Record<string, GooglePlaceDetailsResult> = {
  mock_1:  { formatted_address: 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú',    address_components: [{ long_name: 'Av. Javier Prado Este', short_name: 'Av. Javier Prado Este', types: ['route'] }, { long_name: '1234', short_name: '1234', types: ['street_number'] }, { long_name: 'San Isidro', short_name: 'San Isidro', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.0931, lng: -77.0197 } } },
  mock_2:  { formatted_address: 'Av. Larco 456, Miraflores, Lima, Perú',                 address_components: [{ long_name: 'Av. Larco', short_name: 'Av. Larco', types: ['route'] }, { long_name: '456', short_name: '456', types: ['street_number'] }, { long_name: 'Miraflores', short_name: 'Miraflores', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.1219, lng: -77.0297 } } },
  mock_3:  { formatted_address: 'Jr. de la Unión 789, Cercado de Lima, Lima, Perú',      address_components: [{ long_name: 'Jr. de la Unión', short_name: 'Jr. de la Unión', types: ['route'] }, { long_name: '789', short_name: '789', types: ['street_number'] }, { long_name: 'Cercado de Lima', short_name: 'Cercado de Lima', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.0464, lng: -77.0428 } } },
  mock_4:  { formatted_address: 'Calle Los Pinos 321, Santiago de Surco, Lima, Perú',    address_components: [{ long_name: 'Calle Los Pinos', short_name: 'Calle Los Pinos', types: ['route'] }, { long_name: '321', short_name: '321', types: ['street_number'] }, { long_name: 'Santiago De Surco', short_name: 'Santiago De Surco', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.1500, lng: -76.9900 } } },
  mock_5:  { formatted_address: 'Av. Arequipa 2500, Lince, Lima, Perú',                  address_components: [{ long_name: 'Av. Arequipa', short_name: 'Av. Arequipa', types: ['route'] }, { long_name: '2500', short_name: '2500', types: ['street_number'] }, { long_name: 'Lince', short_name: 'Lince', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.0800, lng: -77.0350 } } },
  mock_6:  { formatted_address: 'Av. Ejército 1100, Miraflores, Lima, Perú',             address_components: [{ long_name: 'Av. Ejército', short_name: 'Av. Ejército', types: ['route'] }, { long_name: '1100', short_name: '1100', types: ['street_number'] }, { long_name: 'Miraflores', short_name: 'Miraflores', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.1100, lng: -77.0450 } } },
  mock_7:  { formatted_address: 'Calle Schell 130, Miraflores, Lima, Perú',              address_components: [{ long_name: 'Calle Schell', short_name: 'Calle Schell', types: ['route'] }, { long_name: '130', short_name: '130', types: ['street_number'] }, { long_name: 'Miraflores', short_name: 'Miraflores', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.1180, lng: -77.0290 } } },
  mock_8:  { formatted_address: 'Av. Benavides 3456, Santiago de Surco, Lima, Perú',     address_components: [{ long_name: 'Av. Benavides', short_name: 'Av. Benavides', types: ['route'] }, { long_name: '3456', short_name: '3456', types: ['street_number'] }, { long_name: 'Santiago De Surco', short_name: 'Santiago De Surco', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.1350, lng: -76.9980 } } },
  mock_9:  { formatted_address: 'Av. Pardo 640, Miraflores, Lima, Perú',                 address_components: [{ long_name: 'Av. Pardo', short_name: 'Av. Pardo', types: ['route'] }, { long_name: '640', short_name: '640', types: ['street_number'] }, { long_name: 'Miraflores', short_name: 'Miraflores', types: ['sublocality_level_1', 'political'] }, { long_name: 'Provincia de Lima', short_name: 'Provincia de Lima', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Lima', short_name: 'Lima', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -12.1200, lng: -77.0280 } } },
  mock_10: { formatted_address: 'Calle Independencia 200, Arequipa, Arequipa, Perú',     address_components: [{ long_name: 'Calle Independencia', short_name: 'Calle Independencia', types: ['route'] }, { long_name: '200', short_name: '200', types: ['street_number'] }, { long_name: 'Arequipa', short_name: 'Arequipa', types: ['locality', 'political'] }, { long_name: 'Provincia de Arequipa', short_name: 'Provincia de Arequipa', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Arequipa', short_name: 'Arequipa', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -16.4090, lng: -71.5375 } } },
  mock_11: { formatted_address: 'Av. El Sol 123, Cusco, Cusco, Perú',                    address_components: [{ long_name: 'Av. El Sol', short_name: 'Av. El Sol', types: ['route'] }, { long_name: '123', short_name: '123', types: ['street_number'] }, { long_name: 'Cusco', short_name: 'Cusco', types: ['locality', 'political'] }, { long_name: 'Provincia del Cusco', short_name: 'Provincia del Cusco', types: ['administrative_area_level_2', 'political'] }, { long_name: 'Cusco', short_name: 'Cusco', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -13.5319, lng: -71.9675 } } },
  mock_12: { formatted_address: 'Jr. Puno 456, Trujillo, La Libertad, Perú',             address_components: [{ long_name: 'Jr. Puno', short_name: 'Jr. Puno', types: ['route'] }, { long_name: '456', short_name: '456', types: ['street_number'] }, { long_name: 'Trujillo', short_name: 'Trujillo', types: ['locality', 'political'] }, { long_name: 'Provincia de Trujillo', short_name: 'Provincia de Trujillo', types: ['administrative_area_level_2', 'political'] }, { long_name: 'La Libertad', short_name: 'La Libertad', types: ['administrative_area_level_1', 'political'] }, { long_name: 'Perú', short_name: 'PE', types: ['country', 'political'] }], geometry: { location: { lat: -8.1116, lng: -79.0288 } } },
};

// ── Server Actions ────────────────────────────────────────────────────────────

/**
 * Busca sugerencias de dirección según el texto ingresado.
 *
 * TODO — integración real con Google Places Autocomplete:
 *
 *   const res = await fetch(
 *     `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
 *     `?input=${encodeURIComponent(query)}` +
 *     `&components=country:pe` +
 *     `&language=es` +
 *     `&types=address` +
 *     `&key=${process.env.GOOGLE_PLACES_API_KEY}`
 *   );
 *   const data = await res.json();
 *   if (data.status !== 'OK') return [];
 *   return data.predictions.map((p: any) => ({
 *     place_id:       p.place_id,
 *     description:    p.description,
 *     main_text:      p.structured_formatting.main_text,
 *     secondary_text: p.structured_formatting.secondary_text,
 *   }));
 */
export async function searchAddressAction(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  await new Promise((r) => setTimeout(r, 300));
  const q = query.toLowerCase();
  return MOCK_SUGGESTIONS.filter(
    (s) => s.description.toLowerCase().includes(q) || s.main_text.toLowerCase().includes(q)
  ).slice(0, 5);
}

/**
 * Obtiene el detalle de un lugar y resuelve el ubigeo por matching de nombre.
 *
 * TODO — integración real con Google Places Details:
 *
 *   const res = await fetch(
 *     `https://maps.googleapis.com/maps/api/place/details/json` +
 *     `?place_id=${placeId}` +
 *     `&fields=formatted_address,address_components,geometry` +
 *     `&language=es` +
 *     `&key=${process.env.GOOGLE_PLACES_API_KEY}`
 *   );
 *   const data = await res.json();
 *   if (data.status !== 'OK' || !data.result) return null;
 *   return mapGoogleToAddressDetail(placeId, data.result);
 *
 * El mapper mapGoogleToAddressDetail ya está implementado arriba y
 * funcionará igual con la respuesta real de Google.
 */
export async function getAddressDetailAction(placeId: string): Promise<AddressDetail | null> {
  await new Promise((r) => setTimeout(r, 200));
  const mockResult = MOCK_GOOGLE_RESULTS[placeId];
  if (!mockResult) return null;
  return mapGoogleToAddressDetail(placeId, mockResult);
}
