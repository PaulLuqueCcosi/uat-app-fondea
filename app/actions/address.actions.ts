'use server';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface AddressSuggestion {
  place_id: string;       // ID único del lugar
  description: string;   // Texto completo que se muestra en el dropdown
  main_text: string;     // Parte principal (calle/avenida)
  secondary_text: string; // Parte secundaria (distrito, ciudad, país)
}

export interface AddressDetail {
  place_id: string;
  formatted_address: string;
  street: string;
  district: string;
  province: string;
  department: string;
  country: string;
  lat?: number;
  lng?: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_SUGGESTIONS: AddressSuggestion[] = [
  {
    place_id: 'mock_1',
    description: 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú',
    main_text: 'Av. Javier Prado Este 1234',
    secondary_text: 'San Isidro, Lima, Perú',
  },
  {
    place_id: 'mock_2',
    description: 'Av. Larco 456, Miraflores, Lima, Perú',
    main_text: 'Av. Larco 456',
    secondary_text: 'Miraflores, Lima, Perú',
  },
  {
    place_id: 'mock_3',
    description: 'Jr. de la Unión 789, Cercado de Lima, Lima, Perú',
    main_text: 'Jr. de la Unión 789',
    secondary_text: 'Cercado de Lima, Lima, Perú',
  },
  {
    place_id: 'mock_4',
    description: 'Calle Los Pinos 321, Surco, Lima, Perú',
    main_text: 'Calle Los Pinos 321',
    secondary_text: 'Surco, Lima, Perú',
  },
  {
    place_id: 'mock_5',
    description: 'Av. Arequipa 2500, Lince, Lima, Perú',
    main_text: 'Av. Arequipa 2500',
    secondary_text: 'Lince, Lima, Perú',
  },
  {
    place_id: 'mock_6',
    description: 'Av. Ejército 1100, Miraflores, Lima, Perú',
    main_text: 'Av. Ejército 1100',
    secondary_text: 'Miraflores, Lima, Perú',
  },
  {
    place_id: 'mock_7',
    description: 'Calle Schell 130, Miraflores, Lima, Perú',
    main_text: 'Calle Schell 130',
    secondary_text: 'Miraflores, Lima, Perú',
  },
  {
    place_id: 'mock_8',
    description: 'Av. Benavides 3456, Surco, Lima, Perú',
    main_text: 'Av. Benavides 3456',
    secondary_text: 'Surco, Lima, Perú',
  },
];

const MOCK_DETAILS: Record<string, AddressDetail> = {
  mock_1: {
    place_id: 'mock_1',
    formatted_address: 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú',
    street: 'Av. Javier Prado Este 1234',
    district: 'San Isidro',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.0931,
    lng: -77.0197,
  },
  mock_2: {
    place_id: 'mock_2',
    formatted_address: 'Av. Larco 456, Miraflores, Lima, Perú',
    street: 'Av. Larco 456',
    district: 'Miraflores',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.1219,
    lng: -77.0297,
  },
  mock_3: {
    place_id: 'mock_3',
    formatted_address: 'Jr. de la Unión 789, Cercado de Lima, Lima, Perú',
    street: 'Jr. de la Unión 789',
    district: 'Cercado de Lima',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.0464,
    lng: -77.0428,
  },
  mock_4: {
    place_id: 'mock_4',
    formatted_address: 'Calle Los Pinos 321, Surco, Lima, Perú',
    street: 'Calle Los Pinos 321',
    district: 'Surco',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.1500,
    lng: -76.9900,
  },
  mock_5: {
    place_id: 'mock_5',
    formatted_address: 'Av. Arequipa 2500, Lince, Lima, Perú',
    street: 'Av. Arequipa 2500',
    district: 'Lince',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.0800,
    lng: -77.0350,
  },
  mock_6: {
    place_id: 'mock_6',
    formatted_address: 'Av. Ejército 1100, Miraflores, Lima, Perú',
    street: 'Av. Ejército 1100',
    district: 'Miraflores',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.1100,
    lng: -77.0450,
  },
  mock_7: {
    place_id: 'mock_7',
    formatted_address: 'Calle Schell 130, Miraflores, Lima, Perú',
    street: 'Calle Schell 130',
    district: 'Miraflores',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.1180,
    lng: -77.0290,
  },
  mock_8: {
    place_id: 'mock_8',
    formatted_address: 'Av. Benavides 3456, Surco, Lima, Perú',
    street: 'Av. Benavides 3456',
    district: 'Surco',
    province: 'Lima',
    department: 'Lima',
    country: 'Perú',
    lat: -12.1350,
    lng: -76.9980,
  },
};

// ── Server Actions ────────────────────────────────────────────────────────────

/**
 * Busca sugerencias de dirección según el texto ingresado.
 *
 * TODO: reemplazar el cuerpo por la llamada real a Google Places Autocomplete:
 *   const res = await fetch(
 *     `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
 *     `?input=${encodeURIComponent(query)}&components=country:pe&language=es` +
 *     `&key=${process.env.GOOGLE_PLACES_API_KEY}`
 *   );
 *   const data = await res.json();
 *   return data.predictions.map((p) => ({
 *     place_id: p.place_id,
 *     description: p.description,
 *     main_text: p.structured_formatting.main_text,
 *     secondary_text: p.structured_formatting.secondary_text,
 *   }));
 */
export async function searchAddressAction(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  // Simula latencia de red
  await new Promise((r) => setTimeout(r, 300));

  const q = query.toLowerCase();
  return MOCK_SUGGESTIONS.filter(
    (s) =>
      s.description.toLowerCase().includes(q) ||
      s.main_text.toLowerCase().includes(q)
  ).slice(0, 5);
}

/**
 * Obtiene el detalle completo de un lugar por su place_id.
 *
 * TODO: reemplazar el cuerpo por la llamada real a Google Places Details:
 *   const res = await fetch(
 *     `https://maps.googleapis.com/maps/api/place/details/json` +
 *     `?place_id=${placeId}&fields=formatted_address,address_components,geometry` +
 *     `&key=${process.env.GOOGLE_PLACES_API_KEY}`
 *   );
 *   const data = await res.json();
 *   // mapear address_components a AddressDetail...
 */
export async function getAddressDetailAction(placeId: string): Promise<AddressDetail | null> {
  await new Promise((r) => setTimeout(r, 200));
  return MOCK_DETAILS[placeId] ?? null;
}
