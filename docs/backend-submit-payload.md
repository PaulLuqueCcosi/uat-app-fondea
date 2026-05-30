# POST /api/v1/applications/submit — Payload del Frontend

## Endpoint

```
POST /api/v1/applications/submit
Authorization: Bearer <jwt>
Content-Type: application/json
```

## Body completo

```json
{
  "intention_id": "f5d31ad0-dafd-4e81-a36e-1ecf7f0cd62a",
  "pep_declarations": {
    "not_pep": true,
    "not_pep_relative": true,
    "accept_terms": true
  },
  "device_fingerprint": {
    "ip": { ... },
    "gps": { ... },
    "proxycheck": { ... },
    "device": { ... },
    "vpnDetected": false,
    "vpnReasons": [],
    "timestamp": "2026-05-29T15:30:00.000Z"
  }
}
```

---

## Campos obligatorios (siempre se envían)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `intention_id` | `string (UUID)` | ID de la intención activa del usuario |
| `pep_declarations.not_pep` | `boolean` | Declara no ser PEP |
| `pep_declarations.not_pep_relative` | `boolean` | Declara no ser familiar de PEP |
| `pep_declarations.accept_terms` | `boolean` | Acepta términos y condiciones |
| `device_fingerprint.device` | `object` | Info del dispositivo (siempre disponible) |
| `device_fingerprint.vpnDetected` | `boolean` | Si se detectó VPN (siempre false si llegó aquí) |
| `device_fingerprint.vpnReasons` | `string[]` | Razones de VPN (siempre [] si llegó aquí) |
| `device_fingerprint.timestamp` | `string (ISO)` | Momento de la recolección |

---

## Campos opcionales (pueden ser null/undefined)

| Campo | Tipo | Cuándo falta | Motivo |
|-------|------|--------------|--------|
| `device_fingerprint.ip` | `object \| undefined` | Ambas APIs de IP fallaron | Rate limit o red lenta |
| `device_fingerprint.gps` | `object \| undefined` | Usuario rechazó permiso GPS | Es opcional |
| `device_fingerprint.proxycheck` | `object \| undefined` | API proxycheck.io falló o no hay IP | Sin créditos o error |

---

## Detalle de cada objeto

### `device_fingerprint.ip` (opcional)

```json
{
  "ip": "190.42.123.45",
  "city": "Lima",
  "region": "Lima",
  "country": "Peru",
  "country_code": "PE",
  "org": "Telefonica del Peru S.A.A.",
  "asn": "AS6147",
  "latitude": -12.0464,
  "longitude": -77.0428
}
```

| Campo | Tipo | Siempre presente |
|-------|------|-----------------|
| `ip` | `string` | ✅ Sí |
| `city` | `string` | ❌ Puede faltar |
| `region` | `string` | ❌ Puede faltar |
| `country` | `string` | ❌ Puede faltar |
| `country_code` | `string` | ❌ Puede faltar |
| `org` | `string` | ❌ Puede faltar |
| `asn` | `string` | ❌ Puede faltar |
| `latitude` | `number` | ❌ Puede faltar |
| `longitude` | `number` | ❌ Puede faltar |

---

### `device_fingerprint.gps` (opcional)

```json
{
  "latitude": -12.0464,
  "longitude": -77.0428,
  "accuracy": 15
}
```

| Campo | Tipo | Siempre presente |
|-------|------|-----------------|
| `latitude` | `number` | ✅ Sí (si gps existe) |
| `longitude` | `number` | ✅ Sí (si gps existe) |
| `accuracy` | `number` | ✅ Sí (metros de precisión) |

---

### `device_fingerprint.proxycheck` (opcional)

```json
{
  "consulted": true,
  "vpn": false,
  "proxy": false,
  "tor": false,
  "anonymous": false,
  "hosting": false,
  "scraper": false,
  "compromised": false,
  "risk_score": 0,
  "risk_score_high": false,
  "risk_score_threshold": 65,
  "confidence": null,
  "network_type": "Residential",
  "provider": "Telefonica del Peru",
  "organisation": "Telefonica del Peru S.A.A.",
  "asn": "AS6147",
  "country_code": "PE",
  "city": "Lima",
  "region": "Lima",
  "operator_name": null,
  "operator_anonymity": null,
  "reason": null
}
```

| Campo | Tipo | Siempre presente |
|-------|------|-----------------|
| `consulted` | `boolean` | ✅ Sí |
| `vpn` | `boolean` | ✅ Sí |
| `proxy` | `boolean` | ✅ Sí |
| `tor` | `boolean` | ✅ Sí |
| `risk_score` | `number` | ✅ Sí |
| `risk_score_high` | `boolean` | ✅ Sí |
| `risk_score_threshold` | `number` | ✅ Sí |
| `anonymous` | `boolean` | ❌ Puede faltar |
| `hosting` | `boolean` | ❌ Puede faltar |
| `scraper` | `boolean` | ❌ Puede faltar |
| `compromised` | `boolean` | ❌ Puede faltar |
| `confidence` | `number \| null` | ❌ Puede ser null |
| `network_type` | `string \| null` | ❌ Puede ser null |
| `provider` | `string \| null` | ❌ Puede ser null |
| `organisation` | `string \| null` | ❌ Puede ser null |
| `asn` | `string \| null` | ❌ Puede ser null |
| `country_code` | `string \| null` | ❌ Puede ser null |
| `city` | `string \| null` | ❌ Puede ser null |
| `region` | `string \| null` | ❌ Puede ser null |
| `operator_name` | `string \| null` | ❌ Puede ser null |
| `operator_anonymity` | `string \| null` | ❌ Puede ser null |
| `reason` | `string` | ❌ Puede faltar |

---

### `device_fingerprint.device` (siempre presente)

```json
{
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)...",
  "deviceType": "mobile",
  "screenResolution": "390x844",
  "devicePixelRatio": 3,
  "language": "es-PE",
  "timezone": "America/Lima",
  "connectionType": "4g",
  "platform": "iPhone",
  "vendor": "Apple Computer, Inc.",
  "cores": 6,
  "memory": 4,
  "touchSupport": true,
  "maxTouchPoints": 5
}
```

| Campo | Tipo | Siempre presente |
|-------|------|-----------------|
| `userAgent` | `string` | ✅ Sí |
| `deviceType` | `"mobile" \| "tablet" \| "desktop"` | ✅ Sí |
| `screenResolution` | `string` (ej: "390x844") | ✅ Sí |
| `devicePixelRatio` | `number` | ✅ Sí |
| `language` | `string` (ej: "es-PE") | ✅ Sí |
| `timezone` | `string` (ej: "America/Lima") | ✅ Sí |
| `platform` | `string` | ✅ Sí |
| `touchSupport` | `boolean` | ✅ Sí |
| `maxTouchPoints` | `number` | ✅ Sí |
| `connectionType` | `string` | ❌ Puede faltar (desktop sin API) |
| `vendor` | `string` | ❌ Puede faltar |
| `cores` | `number` | ❌ Puede faltar |
| `memory` | `number` | ❌ Puede faltar |

---

## Ejemplo completo — caso ideal (todo disponible)

```json
{
  "intention_id": "f5d31ad0-dafd-4e81-a36e-1ecf7f0cd62a",
  "pep_declarations": {
    "not_pep": true,
    "not_pep_relative": true,
    "accept_terms": true
  },
  "device_fingerprint": {
    "ip": {
      "ip": "190.42.123.45",
      "city": "Lima",
      "region": "Lima",
      "country": "Peru",
      "country_code": "PE",
      "org": "Telefonica del Peru S.A.A.",
      "asn": "AS6147",
      "latitude": -12.0464,
      "longitude": -77.0428
    },
    "gps": {
      "latitude": -12.0470,
      "longitude": -77.0430,
      "accuracy": 12
    },
    "proxycheck": {
      "consulted": true,
      "vpn": false,
      "proxy": false,
      "tor": false,
      "anonymous": false,
      "hosting": false,
      "scraper": false,
      "compromised": false,
      "risk_score": 0,
      "risk_score_high": false,
      "risk_score_threshold": 65,
      "confidence": null,
      "network_type": "Residential",
      "provider": "Telefonica del Peru",
      "organisation": "Telefonica del Peru S.A.A.",
      "asn": "AS6147",
      "country_code": "PE",
      "city": "Lima",
      "region": "Lima",
      "operator_name": null,
      "operator_anonymity": null,
      "reason": null
    },
    "device": {
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
      "deviceType": "mobile",
      "screenResolution": "390x844",
      "devicePixelRatio": 3,
      "language": "es-PE",
      "timezone": "America/Lima",
      "connectionType": "4g",
      "platform": "iPhone",
      "vendor": "Apple Computer, Inc.",
      "cores": 6,
      "memory": 4,
      "touchSupport": true,
      "maxTouchPoints": 5
    },
    "vpnDetected": false,
    "vpnReasons": [],
    "timestamp": "2026-05-29T15:30:00.000Z"
  }
}
```

---

## Ejemplo mínimo — sin GPS, sin IP, sin proxycheck

```json
{
  "intention_id": "f5d31ad0-dafd-4e81-a36e-1ecf7f0cd62a",
  "pep_declarations": {
    "not_pep": true,
    "not_pep_relative": true,
    "accept_terms": true
  },
  "device_fingerprint": {
    "device": {
      "userAgent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36",
      "deviceType": "mobile",
      "screenResolution": "412x915",
      "devicePixelRatio": 2.625,
      "language": "es-419",
      "timezone": "America/Lima",
      "platform": "Linux armv81",
      "touchSupport": true,
      "maxTouchPoints": 5
    },
    "vpnDetected": false,
    "vpnReasons": [],
    "timestamp": "2026-05-29T15:30:00.000Z"
  }
}
```

---

## Notas para el backend

1. **`device_fingerprint` puede ser `null`** — si `collectFingerprint()` falla completamente (muy raro), el frontend no envía este campo. El backend debe aceptar el submit sin fingerprint.

2. **`vpnDetected` siempre será `false`** cuando llega al backend — si fuera `true`, el frontend bloquea antes de enviar. Pero se envía igual para registro/auditoría.

3. **El frontend ya validó territorio** — si la IP no es PE o el GPS está fuera de Perú, el frontend bloquea. Pero el backend debería hacer su propia validación con la IP del request HTTP como segunda línea de defensa.

4. **`device_fingerprint` es para scoring/auditoría** — el backend puede usarlo para:
   - Enriquecer el score de riesgo
   - Detectar patrones de fraude (mismo device, múltiples solicitudes)
   - Auditoría post-mortem si hay fraude
   - Validar consistencia (timezone vs país, language vs país)
