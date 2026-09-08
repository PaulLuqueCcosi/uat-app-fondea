# Reglas de Evaluación de Conexión y Antifraude — Fondea

## Objetivo

Antes de permitir que un usuario envíe una solicitud de préstamo, el sistema evalúa:

1. **Conexión** — Detectar VPN, proxy, Tor o conexiones sospechosas
2. **Territorio** — Verificar que el usuario esté en Perú (IP y/o GPS)
3. **Consistencia** — Verificar que la ubicación GPS y la IP no estén a distancias absurdas

Si alguna validación falla → **se bloquea el envío** y se muestra un modal explicativo.

---

## Flujo Completo (paso a paso)

```
Usuario hace clic en "Enviar solicitud"
    ↓
1. Validar intención activa (backend)
    ↓ (si no hay → error "Ve a la calculadora")
2. Validar declaraciones PEP (checkboxes)
    ↓ (si faltan → error visual)
3. collectFingerprint() — recolecta TODO en paralelo:
    ├── getPublicIP()  → IP, ciudad, país, org, lat/lon
    ├── getGPS()       → lat/lon/accuracy del navegador (pide permiso)
    └── getDeviceInfo() → UA, resolución, timezone, etc.
    ↓
4. Si getGPS() falla (usuario rechazó o no soportado):
    → Mostrar LocationDeclinedModal
    → Usuario puede "Reintentar" o "Continuar sin GPS"
    ↓
5. Consultar proxycheck.io con la IP obtenida
    ↓
6. Evaluar reglas locales (detectLocalVPN):
    ├── ¿Organización de IP sospechosa? (nordvpn, expressvpn, etc.)
    └── ¿GPS a más de 1500km de la IP? → sospechoso
    ↓
7. Combinar veredicto LOCAL + proxycheck.io
    ↓
8. Si VPN/Proxy detectado → BLOQUEAR (VPNBlockModal)
    ↓
9. Verificar territorio peruano (checkPeruTerritory):
    ├── ¿IP countryCode === 'PE'?
    └── ¿GPS dentro del bounding box de Perú?
    ↓
10. Si fuera de Perú → BLOQUEAR (TerritoryBlockModal)
    ↓
11. Todo OK → enviar solicitud al backend con fingerprint completo
```

---

## Fuentes de Datos

### Fuente 1: LOCAL (gratis, siempre disponible)

Datos que obtenemos directamente del navegador, sin APIs externas.

| Dato | Cómo se obtiene | Qué evalúa |
|------|-----------------|------------|
| **IP pública** | `fetch('https://ipapi.co/json/')` | Ciudad, país, countryCode, org, ASN, lat/lon |
| **GPS** | `navigator.geolocation.getCurrentPosition()` | Lat/lon/accuracy del dispositivo real |
| **Device info** | APIs del navegador | UA, tipo dispositivo, resolución, timezone, RAM, CPU, touch |

### Fuente 2: proxycheck.io (API externa)

| Campo | Qué significa |
|-------|--------------|
| `vpn: true` | VPN detectada |
| `proxy: true` | Proxy detectado |
| `tor: true` | Nodo TOR detectado |
| `anonymous: true` | Conexión anónima |
| `hosting: true` | IP de datacenter/hosting (no residencial) |
| `scraper: true` | Scraper/bot detectado |
| `compromised: true` | IP comprometida/hackeada |
| `risk_score >= 65` | Puntaje de riesgo elevado (0-100) |
| `operator_name` | Nombre del operador VPN (ej. "NordVPN") |

---

## Validación 1: VPN / Proxy / Tor

### Reglas locales (detectLocalVPN)

```typescript
// Si la organización de la IP contiene palabras sospechosas:
const vpnOrgs = ['vpn', 'proxy', 'virtual', 'tor', 'openvpn', 'nordvpn',
  'expressvpn', 'surfshark', 'protonvpn', 'mullvad', 'cyberghost',
  'tunnelbear', 'ipvanish', 'purevpn', 'vyprvpn'];

// Si GPS está a más de 1500km de la ubicación de la IP:
if (distance > 1500) → sospechoso
```

### Reglas proxycheck.io

**Señales duras** (bloquean siempre, sin importar el `risk_score`):
- `tor`, `compromised`

**Señales blandas** (solo bloquean si además `risk_score_high` es `true`, umbral `risk_score_threshold` normalmente 65):
- `vpn`, `proxy`, `anonymous`, `hosting`, `scraper`
- `operator_name` presente (indica operador VPN/proxy conocido)

**Por qué la distinción** (2026-09-08): un ISP legítimo puede caer en un rango de IP que proxycheck asocia a un proveedor de proxies residenciales (ej. Rayobyte) sin que el usuario esté usando nada raro — `proxy: true` con `risk_score: 0` es un falso positivo real observado en producción/dev (IP de "CALA SERVICIOS INTEGRALES E.I.R.L.", `network_type: Business`). Exigir `risk_score_high` para las señales blandas evita bloquear a esos usuarios reales, mientras que `tor`/`compromised` siguen siendo casi inequívocos de fraude y bloquean sin condición.

### Veredicto combinado

```
Si LOCAL tiene razones       → sumar
Si PROXYCHECK tiene razones  → sumar
Si AL MENOS UNA fuente tiene razones → vpnDetected = true → BLOQUEAR
```

### Modal que se muestra (VPNBlockModal)

| Caso | Mensaje |
|------|---------|
| TOR detectado | "No se permite conexiones por TOR" |
| VPN detectada | "No se permite VPN" |
| Proxy detectado | "Conexión no permitida" |
| Otro sospechoso | "Su conexión es sospechosa. Inténtalo desde otro dispositivo." |

---

## Validación 2: Territorio Peruano (checkPeruTerritory)

### Regla por IP

```typescript
if (ip.countryCode !== 'PE') → BLOQUEAR
```

Si la IP no es peruana, se asume que el usuario no está en Perú.

### Regla por GPS

Se usa un **bounding box** que cubre todo el territorio peruano con margen de ~50km:

```typescript
const PERU_BOUNDS = {
  latMin: -18.45,  // Sur (Tacna + margen)
  latMax:   0.05,  // Norte (Loreto + margen)
  lonMin: -81.40,  // Oeste (costa Piura + margen)
  lonMax: -68.60,  // Este (Madre de Dios + margen)
};
```

Si el GPS está fuera de estos límites → BLOQUEAR.

### Lógica combinada

```
¿IP no es PE?           → bloquear (razón: "IP ubicada en [país]")
¿GPS fuera de bounds?   → bloquear (razón: "GPS fuera de Perú")
¿No hay GPS pero IP=PE? → PERMITIR (GPS es opcional)
¿No hay IP?             → bloquear (razón: "No se pudo verificar país")
```

### Modal que se muestra (TerritoryBlockModal)

Mensaje adaptado según la fuente:
- Solo IP → "Tu dirección IP indica que no te encuentras en Perú"
- Solo GPS → "Tu ubicación GPS indica que no te encuentras en territorio peruano"
- Ambos → "Tanto tu IP como tu GPS indican que no estás en Perú"

---

## Validación 3: Distancia GPS vs IP

Esta validación es parte de `detectLocalVPN` y detecta inconsistencias:

```
Si GPS está a más de 1500km de la ubicación de la IP → sospechoso (posible VPN)
```

**¿Por qué 1500km?**
- Perú mide ~2000km de norte a sur y ~1500km de este a oeste
- La geolocalización por IP no es precisa (puede errar por cientos de km)
- Un usuario en Iquitos con IP que geolocaliza en Lima (~1000km) no debe ser bloqueado
- 1500km es un umbral seguro que solo se activa con discrepancias realmente absurdas

**Ejemplo de activación legítima:**
- GPS dice: Lima, Perú (-12.04, -77.03)
- IP dice: Miami, USA (25.76, -80.19)
- Distancia: ~5200km → **VPN detectada**

---

## Manejo del GPS

### Permiso del navegador

El sistema pide permiso de GPS via `navigator.geolocation.getCurrentPosition()`.

**Requisito:** El header `Permissions-Policy` debe incluir `geolocation=(self)` en `next.config.ts`.

### Si el usuario rechaza el GPS

Se muestra `LocationDeclinedModal` con dos opciones:
1. **"Reintentar"** → vuelve a pedir permiso (el navegador puede o no volver a preguntar)
2. **"Continuar sin GPS"** → procede solo con la IP (puede afectar score)

### Errores posibles de GPS

| Error | Significado |
|-------|-------------|
| `PERMISSION_DENIED` | Usuario rechazó el permiso |
| `POSITION_UNAVAILABLE` | GPS no disponible en el dispositivo |
| `TIMEOUT` | Tardó más de 10 segundos en obtener ubicación |
| `NOT_SUPPORTED` | Navegador no soporta geolocation |

---

## Datos que se envían al Backend

Todo lo recolectado se envía como `device_fingerprint` en el payload de la solicitud:

```json
{
  "ip": {
    "ip": "190.42.xxx.xxx",
    "city": "Lima",
    "region": "Lima",
    "country": "Peru",
    "country_code": "PE",
    "org": "Telefonica del Peru",
    "asn": "AS6147",
    "latitude": -12.04,
    "longitude": -77.03
  },
  "gps": {
    "latitude": -12.0464,
    "longitude": -77.0428,
    "accuracy": 15
  },
  "proxycheck": {
    "consulted": true,
    "vpn": false,
    "proxy": false,
    "tor": false,
    "risk_score": 0,
    "risk_score_high": false,
    "...": "..."
  },
  "device": {
    "userAgent": "Mozilla/5.0...",
    "deviceType": "mobile",
    "screenResolution": "390x844",
    "language": "es-PE",
    "timezone": "America/Lima",
    "platform": "iPhone",
    "cores": 6,
    "memory": 4,
    "touchSupport": true,
    "maxTouchPoints": 5
  },
  "vpnDetected": false,
  "vpnReasons": [],
  "territoryCheck": {
    "inPeru": true,
    "reasons": [],
    "ipCountry": "PE",
    "gpsInBounds": true
  },
  "timestamp": "2026-05-29T15:30:00.000Z"
}
```

---

## Archivos Clave

| Archivo | Rol |
|---------|-----|
| `lib/client-api/device-fingerprint.ts` | Toda la lógica de recolección y evaluación |
| `hooks/useDeviceFingerprint.ts` | Hook React que expone `collect()` al componente |
| `components/solicitar/SolicitarSummary.tsx` | Orquesta el flujo: collect → evaluar → bloquear o enviar |
| `components/solicitar/VPNBlockModal.tsx` | Modal de bloqueo por VPN/proxy/tor |
| `components/solicitar/TerritoryBlockModal.tsx` | Modal de bloqueo por territorio (fuera de Perú) |
| `components/solicitar/LocationDeclinedModal.tsx` | Modal cuando el usuario rechaza GPS |
| `app/api/proxycheck-check/route.ts` | API route proxy a proxycheck.io (evita exponer API key) |
| `next.config.ts` | Header `Permissions-Policy: geolocation=(self)` |

---

## Configuración

| Variable | Propósito |
|----------|-----------|
| `PROXYCHECK_API_KEY` | API key de proxycheck.io (sin key = plan gratuito 100 consultas/día) |

---

## Resumen de Bloqueos

| Validación | Condición | Modal | ¿Puede continuar? |
|------------|-----------|-------|-------------------|
| VPN/Proxy/Tor | `vpnDetected === true` | VPNBlockModal | ❌ No |
| Fuera de Perú | `territoryCheck.inPeru === false` | TerritoryBlockModal | ❌ No |
| Sin GPS | `gps === null` | LocationDeclinedModal | ✅ Sí (con botón "Continuar") |

---

## Notas Importantes

- Si proxycheck.io **falla o no tiene créditos**, el sistema sigue funcionando con las **reglas locales** (IP org + distancia GPS)
- La detección no es 100% perfecta, pero cubre la gran mayoría de VPN/proxy/TOR comerciales
- El **GPS es opcional** — si el usuario lo rechaza puede continuar, pero la IP sola debe ser peruana
- El bounding box de Perú tiene **margen de ~50km** en todas las fronteras para evitar falsos positivos en zonas limítrofes
- Todo el fingerprint se envía al backend para que el scoring lo use como factor adicional
