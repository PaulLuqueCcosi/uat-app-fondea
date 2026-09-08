/**
 * Servicio de recolección de fingerprint del dispositivo/ubicación.
 *
 * Fuentes de datos:
 *   1. LOCAL — Siempre disponible, gratuita (IP, GPS, device, timezone)
 *   2. proxycheck.io — API de terceros (VPN/proxy/TOR/risk_score/operator)
 *
 * El veredicto final combina LOCAL + proxycheck.io. Todo se envía al backend.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  org?: string;
  asn?: string;
  latitude?: number;
  longitude?: number;
}

export interface GPSInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GPSPermissionError = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';

export interface GPSResult {
  data: GPSInfo | null;
  error?: GPSPermissionError;
}

export interface DeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenResolution: string;
  devicePixelRatio: number;
  language: string;
  timezone: string;
  connectionType?: string;
  platform: string;
  vendor?: string;
  cores?: number;
  memory?: number;
  touchSupport: boolean;
  maxTouchPoints: number;
}

// ── Fuente 2: proxycheck.io ─────────────────────────────────────────────────

export interface ProxyCheckResult {
  consulted: boolean;
  ip?: string;
  proxy: boolean;
  vpn: boolean;
  tor: boolean;
  hosting?: boolean;
  scraper?: boolean;
  compromised?: boolean;
  anonymous?: boolean;
  risk_score: number;
  risk_score_high: boolean;
  risk_score_threshold: number;
  confidence?: number | null;
  network_type?: string | null;
  provider?: string | null;
  organisation?: string | null;
  asn?: string | null;
  country_code?: string | null;
  city?: string | null;
  region?: string | null;
  operator_name?: string | null;
  operator_anonymity?: string | null;
  attack_history?: unknown;
  detection_history?: unknown;
  reason?: string;
}

// ── Resultado final ───────────────────────────────────────────────────────────

export interface FingerprintResult {
  // Fuente 1: Local (siempre disponible)
  ip: IPInfo | null;
  gps: GPSInfo | null;
  gpsError?: GPSPermissionError;
  device: DeviceInfo;

  // Fuente 2: proxycheck.io
  proxycheck: ProxyCheckResult | null;

  // Veredicto combinado
  vpnDetected: boolean;
  vpnReasons: string[];

  // Verificación de territorio peruano
  territoryCheck: TerritoryCheckResult;

  // Metadata
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUENTE 1: LOCAL — Siempre disponible, gratuita
// ═══════════════════════════════════════════════════════════════════════════════

export async function getPublicIP(): Promise<IPInfo | null> {
  // Intento 1: ipapi.co (1000 req/día gratis)
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        countryCode: data.country_code,
        org: data.org,
        asn: data.asn,
        latitude: data.latitude,
        longitude: data.longitude,
      };
    }
  } catch { /* fallback */ }

  // Intento 2: ip-api.com (45 req/min gratis, sin HTTPS en plan free)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,regionName,city,lat,lon,isp,as,query', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          ip: data.query,
          city: data.city,
          region: data.regionName,
          country: data.country,
          countryCode: data.countryCode,
          org: data.isp,
          asn: data.as,
          latitude: data.lat,
          longitude: data.lon,
        };
      }
    }
  } catch { /* sin IP disponible */ }

  return null;
}

export function getGPS(): Promise<GPSResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ data: null, error: 'NOT_SUPPORTED' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          data: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        });
      },
      (err) => {
        const code = err.code;
        if (code === 1) resolve({ data: null, error: 'PERMISSION_DENIED' });
        else if (code === 2) resolve({ data: null, error: 'POSITION_UNAVAILABLE' });
        else if (code === 3) resolve({ data: null, error: 'TIMEOUT' });
        else resolve({ data: null, error: 'POSITION_UNAVAILABLE' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function getDeviceInfo(): DeviceInfo {
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection;
  const ua = navigator.userAgent;

  return {
    userAgent: ua,
    deviceType: /Mobi|Android|iPhone/i.test(ua)
      ? 'mobile'
      : /iPad|Tablet/i.test(ua)
        ? 'tablet'
        : 'desktop',
    screenResolution: `${screen.width}x${screen.height}`,
    devicePixelRatio: window.devicePixelRatio ?? 1,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connectionType: conn?.effectiveType,
    platform: navigator.platform,
    vendor: (navigator as any).vendor,
    cores: (navigator as any).hardwareConcurrency,
    memory: (navigator as any).deviceMemory,
    touchSupport: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}

export function detectLocalVPN(ip: IPInfo | null, gps: GPSInfo | null): { detected: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Si no hay IP (APIs fallaron) → no podemos evaluar, no bloquear
  if (!ip) {
    return { detected: false, reasons };
  }

  const org = (ip.org || '').toLowerCase();
  const vpnOrgs = ['vpn', 'proxy', 'virtual', 'tor', 'openvpn', 'nordvpn', 'expressvpn', 'surfshark', 'protonvpn', 'mullvad', 'cyberghost', 'tunnelbear', 'ipvanish', 'purevpn', 'vyprvpn'];
  if (vpnOrgs.some((k) => org.includes(k))) {
    reasons.push(`LOCAL: Organización sospechosa: ${ip.org}`);
  }

  if (gps && ip.latitude != null && ip.longitude != null) {
    const distance = haversineDistance(gps.latitude, gps.longitude, ip.latitude, ip.longitude);
    if (distance > 1500) {
      reasons.push(
        `LOCAL: GPS (${gps.latitude.toFixed(2)}, ${gps.longitude.toFixed(2)}) a ${Math.round(distance)}km de la IP (${ip.city}, ${ip.country})`
      );
    }
  }

  return { detected: reasons.length > 0, reasons };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUENTE 2: proxycheck.io
// ═══════════════════════════════════════════════════════════════════════════════

export async function getProxyCheck(ip: string): Promise<ProxyCheckResult | null> {
  try {
    const res = await fetch(`/api/proxycheck-check?ip=${encodeURIComponent(ip)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Señales "duras" — casi inequívocas de fraude, bloquean sin importar el
 * risk_score. El resto de las señales de proxycheck (proxy/vpn/anonymous/
 * hosting/scraper) son ruidosas: un ISP legítimo puede caer en un rango de
 * IP marcado por asociarse a un proveedor de proxies residenciales (ej.
 * Rayobyte) sin que el usuario esté usando nada raro. Para esas, exigimos
 * que el propio risk_score agregado de proxycheck también sea alto — así
 * confiamos en su score calibrado en vez de reaccionar a un flag suelto.
 */
function extractProxyCheckReasons(pc: ProxyCheckResult): string[] {
  const reasons: string[] = [];

  if (pc.tor) reasons.push('ProxyCheck: Tor detectado');
  if (pc.compromised) reasons.push('ProxyCheck: IP comprometida');

  if (pc.risk_score_high) {
    if (pc.vpn) reasons.push('ProxyCheck: VPN detectado');
    if (pc.proxy) reasons.push('ProxyCheck: Proxy detectado');
    if (pc.anonymous) reasons.push('ProxyCheck: Conexión anónima');
    if (pc.hosting) reasons.push('ProxyCheck: IP de hosting/datacenter');
    if (pc.scraper) reasons.push('ProxyCheck: Scraper detectado');
    reasons.push(`ProxyCheck: Risk score alto (${pc.risk_score} >= ${pc.risk_score_threshold})`);
    if (pc.operator_name) {
      reasons.push(`ProxyCheck: Operador: ${pc.operator_name}`);
    }
  }

  return reasons;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VEREDICTO COMBINADO
// ═══════════════════════════════════════════════════════════════════════════════

interface Verdict {
  detected: boolean;
  reasons: string[];
  sources: {
    local: boolean;
    proxycheck: boolean;
  };
}

// ── Validación de territorio peruano ──────────────────────────────────────────

/**
 * Bounding box de Perú (con margen de ~50km en fronteras).
 * Lat: -18.35 (sur, Tacna) a -0.04 (norte, Loreto)
 * Lon: -81.35 (oeste, Piura/costa) a -68.65 (este, Madre de Dios)
 */
const PERU_BOUNDS = {
  latMin: -18.45,
  latMax: 0.05,
  lonMin: -81.40,
  lonMax: -68.60,
};

export interface TerritoryCheckResult {
  inPeru: boolean;
  reasons: string[];
  ipCountry: string | null;
  gpsInBounds: boolean | null; // null si no hay GPS
}

/**
 * Verifica que el usuario esté en territorio peruano.
 * Usa dos fuentes: IP (country_code) y GPS (bounding box).
 *
 * Reglas:
 * - Si la IP no es de Perú → bloquear (fuerte indicador de fraude)
 * - Si el GPS está fuera del bounding box de Perú → bloquear
 * - Si no hay GPS pero la IP es peruana → permitir (GPS es opcional)
 */
export function checkPeruTerritory(ip: IPInfo | null, gps: GPSInfo | null): TerritoryCheckResult {
  const reasons: string[] = [];
  let ipCountry: string | null = null;
  let gpsInBounds: boolean | null = null;

  // ── Verificación por IP ─────────────────────────────────────────────────────
  if (ip) {
    ipCountry = ip.countryCode ?? null;
    if (ipCountry && ipCountry.toUpperCase() !== 'PE') {
      reasons.push(`TERRITORIO: IP ubicada en ${ip.country ?? ipCountry} (se requiere Perú)`);
    }
  }
  // Si no hay IP (APIs fallaron) → NO bloquear, el backend validará después

  // ── Verificación por GPS ────────────────────────────────────────────────────
  if (gps) {
    const { latitude, longitude } = gps;
    const inBounds =
      latitude >= PERU_BOUNDS.latMin &&
      latitude <= PERU_BOUNDS.latMax &&
      longitude >= PERU_BOUNDS.lonMin &&
      longitude <= PERU_BOUNDS.lonMax;

    gpsInBounds = inBounds;

    if (!inBounds) {
      reasons.push(
        `TERRITORIO: GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) fuera de Perú`
      );
    }
  }
  // Si no hay GPS, no penalizamos — la IP es suficiente

  const inPeru = reasons.length === 0;

  return { inPeru, reasons, ipCountry, gpsInBounds };
}

export function combineVerdict(
  local: { detected: boolean; reasons: string[] },
  proxycheck: ProxyCheckResult | null
): Verdict {
  const reasons: string[] = [];
  const sources = { local: false, proxycheck: false };

  if (local.detected) {
    sources.local = true;
    reasons.push(...local.reasons);
  }

  if (proxycheck && proxycheck.consulted) {
    const pcReasons = extractProxyCheckReasons(proxycheck);
    if (pcReasons.length > 0) {
      sources.proxycheck = true;
      reasons.push(...pcReasons);
    }
  }

  const detected = sources.local || sources.proxycheck;

  return { detected, reasons, sources };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOLECCIÓN COMPLETA
// ═══════════════════════════════════════════════════════════════════════════════

export async function collectFingerprint(): Promise<FingerprintResult> {
  const [ip, gpsResult] = await Promise.all([
    getPublicIP(),
    getGPS(),
  ]);

  const device = getDeviceInfo();
  const localVPN = detectLocalVPN(ip, gpsResult.data);

  let proxycheck: ProxyCheckResult | null = null;

  if (ip?.ip) {
    const [proxyRes] = await Promise.allSettled([
      getProxyCheck(ip.ip),
    ]);

    if (proxyRes.status === 'fulfilled') proxycheck = proxyRes.value;
  }

  const verdict = combineVerdict(localVPN, proxycheck);
  const territoryCheck = checkPeruTerritory(ip, gpsResult.data);

  return {
    ip,
    gps: gpsResult.data,
    gpsError: gpsResult.error,
    proxycheck,
    device,
    vpnDetected: verdict.detected,
    vpnReasons: verdict.reasons,
    territoryCheck,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOG EN CONSOLA
// ═══════════════════════════════════════════════════════════════════════════════

export function logFingerprint(fp: FingerprintResult) {
  console.group('🔍 === DEVICE FINGERPRINT ===');
  console.log('Timestamp:', fp.timestamp);
  console.log('');

  // ── Fuente 1: Local ───────────────────────────────────────────────────────
  console.group('📡 FUENTE 1 — LOCAL (siempre disponible)');

  console.group('📍 IP Pública');
  console.log('IP:', fp.ip?.ip ?? 'No disponible');
  console.log('Ciudad:', fp.ip?.city ?? 'N/A');
  console.log('Región:', fp.ip?.region ?? 'N/A');
  console.log('País:', fp.ip?.country ?? 'N/A');
  console.log('Código país:', fp.ip?.countryCode ?? 'N/A');
  console.log('Organización:', fp.ip?.org ?? 'N/A');
  console.log('ASN:', fp.ip?.asn ?? 'N/A');
  console.log('Lat/Lon:', fp.ip?.latitude ?? 'N/A', fp.ip?.longitude ?? 'N/A');
  console.groupEnd();

  console.group('📡 GPS del Navegador');
  if (fp.gps) {
    console.log('Lat:', fp.gps.latitude);
    console.log('Lon:', fp.gps.longitude);
    console.log('Precisión:', fp.gps.accuracy + 'm');
  } else {
    console.log('No disponible (usuario rechazó o no soportado)');
  }
  console.groupEnd();

  console.group('💻 Dispositivo');
  console.log('Tipo:', fp.device.deviceType);
  console.log('Plataforma:', fp.device.platform);
  console.log('Vendor:', fp.device.vendor ?? 'N/A');
  console.log('User Agent:', fp.device.userAgent);
  console.log('Resolución:', fp.device.screenResolution);
  console.log('Pixel Ratio:', fp.device.devicePixelRatio);
  console.log('Idioma:', fp.device.language);
  console.log('Timezone:', fp.device.timezone);
  console.log('Conexión:', fp.device.connectionType ?? 'N/A');
  console.log('Cores CPU:', fp.device.cores ?? 'N/A');
  console.log('RAM (GB):', fp.device.memory ?? 'N/A');
  console.log('Touch:', fp.device.touchSupport, `(max ${fp.device.maxTouchPoints} puntos)`);
  console.groupEnd();

  console.groupEnd(); // Fin Fuente 1
  console.log('');

  // ── Fuente 2: proxycheck.io ───────────────────────────────────────────────
  console.group('🌐 FUENTE 2 — proxycheck.io');
  if (fp.proxycheck) {
    console.log('Consultado:', fp.proxycheck.consulted ? 'Sí' : 'No');
    if (fp.proxycheck.consulted) {
      console.log('VPN:', fp.proxycheck.vpn ? '⚠️ SÍ' : 'No');
      console.log('Proxy:', fp.proxycheck.proxy ? '⚠️ SÍ' : 'No');
      console.log('Tor:', fp.proxycheck.tor ? '⚠️ SÍ' : 'No');
      console.log('Anonymous:', fp.proxycheck.anonymous ? '⚠️ SÍ' : 'No');
      console.log('Hosting:', fp.proxycheck.hosting ? '⚠️ SÍ' : 'No');
      console.log('Scraper:', fp.proxycheck.scraper ? '⚠️ SÍ' : 'No');
      console.log('Compromised:', fp.proxycheck.compromised ? '⚠️ SÍ' : 'No');
      console.log('Risk Score:', fp.proxycheck.risk_score, fp.proxycheck.risk_score_high ? '(ALTO)' : '(Normal)');
      console.log('Confidence:', fp.proxycheck.confidence ?? 'N/A');
      console.log('Network Type:', fp.proxycheck.network_type ?? 'N/A');
      console.log('Provider:', fp.proxycheck.provider ?? 'N/A');
      console.log('Organisation:', fp.proxycheck.organisation ?? 'N/A');
      console.log('Operator:', fp.proxycheck.operator_name ?? 'N/A');
    } else {
      console.log('Motivo:', fp.proxycheck.reason ?? 'No consultado');
    }
  } else {
    console.log('No disponible');
  }
  console.groupEnd();
  console.log('');

  // ── Veredicto final ────────────────────────────────────────────────────────
  console.group('⚖️ VEREDICTO FINAL');
  console.log('VPN/Proxy detectado:', fp.vpnDetected ? '⚠️ SÍ — BLOQUEAR' : '✅ NO — PERMITIR');
  if (fp.vpnReasons.length > 0) {
    console.log('Razones:');
    fp.vpnReasons.forEach((r) => console.log('  •', r));
  }
  console.groupEnd();

  // ── Verificación territorial ────────────────────────────────────────────────
  console.group('🇵🇪 VERIFICACIÓN TERRITORIAL');
  console.log('En Perú:', fp.territoryCheck.inPeru ? '✅ SÍ' : '❌ NO — BLOQUEAR');
  console.log('País IP:', fp.territoryCheck.ipCountry ?? 'N/A');
  console.log('GPS en bounds:', fp.territoryCheck.gpsInBounds === null ? 'Sin GPS' : fp.territoryCheck.gpsInBounds ? '✅ Sí' : '❌ No');
  if (fp.territoryCheck.reasons.length > 0) {
    console.log('Razones:');
    fp.territoryCheck.reasons.forEach((r) => console.log('  •', r));
  }
  console.groupEnd();

  console.groupEnd(); // Fin fingerprint
}
