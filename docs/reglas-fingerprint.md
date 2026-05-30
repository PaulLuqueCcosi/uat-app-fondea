# Reglas de Evaluación de Conexión — Fondea

## Objetivo
Antes de permitir que un usuario envíe una solicitud de préstamo, evaluamos su conexión para detectar VPN, proxy, Tor o conexiones sospechosas que puedan indicar fraude.

---

## Fuentes de Evaluación

El sistema consulta **2 fuentes de datos** y combina los resultados:

### 1. Local (gratis, siempre disponible)
Datos que obtenemos directamente del navegador del usuario, sin depender de APIs externas.

| Dato | Qué evalúa |
|------|-----------|
| **IP pública** | Ciudad, país, organización (ISP), ASN |
| **GPS** | Ubicación exacta del dispositivo (con permiso del usuario) |
| **Device info** | Tipo de dispositivo, resolución, idioma, timezone, RAM, CPU |

**Reglas locales:**
- Si la organización de la IP contiene palabras como "vpn", "proxy", "nordvpn", "expressvpn", etc. → **sospechoso**
- Si el GPS está a más de **1000 km** de la ubicación de la IP → **sospechoso** (ej. GPS en Lima, IP en Miami)

### 2. proxycheck.io — API externa
Base de datos para validar y detectar VPN/proxy/TOR.

| Campo | Qué significa |
|-------|--------------|
| `vpn: true` | VPN detectada |
| `proxy: true` | Proxy detectado |
| `tor: true` | Nodo TOR detectado |
| `anonymous: true` | Conexión anónima detectada |
| `hosting: true` | IP de datacenter/hosting (no residencial) |
| `scraper: true` | Scraper/web crawler detectado |
| `compromised: true` | IP comprometida/hackeada |
| `risk_score >= 65` | Puntaje de riesgo elevado (0-100) |
| `operator_name` | Nombre del operador (ej. "NordVPN", "ExpressVPN") |

---

## Veredicto Final

El sistema **combina las 2 fuentes** y aplica esta lógica:

```
Si LOCAL detecta algo       →  sumar a razones
Si PROXYCHECK detecta algo  →  sumar a razones

Si AL MENOS UNA fuente tiene razones → BLOQUEAR
Si NINGUNA tiene razones → PERMITIR
```

### Casos de Bloqueo

| Caso | Qué muestra al usuario |
|------|------------------------|
| **TOR detectado** | *"No se permite conexiones por TOR"* |
| **VPN detectada** | *"No se permite VPN"* |
| **Proxy detectado** | *"Conexión no permitida"* |
| **Bot / Scraper / Comprometida / Sospechoso** | *"Su conexión es sospechosa. Inténtalo desde otro dispositivo."* |

---

## Flujo de Evaluación (paso a paso)

1. Usuario hace clic en **"Enviar solicitud"**
2. Sistema pide **GPS** (obligatorio mostrar, opcional enviar)
3. Sistema obtiene **IP pública** + **device info**
4. Sistema consulta **proxycheck.io**
5. Sistema aplica **reglas locales**
6. Sistema **combina LOCAL + proxycheck.io**
7. Si detecta algo → **bloquea** y muestra modal explicativo
8. Si todo limpio → **permite continuar**

---

## Datos que se envían al Backend

Todo lo recolectado se envía al backend para que el scoring lo use si es necesario:

- IP + ubicación + organización
- GPS (si el usuario aceptó)
- Device info completo
- Resultado crudo de proxycheck.io
- Veredicto final (detectado: sí/no + razones)

---

## Configuración

| Variable | Propósito |
|----------|-----------|
| `PROXYCHECK_API_KEY` | API key de proxycheck.io (opcional, sin key funciona plan gratuito 100/día) |

---

## Notas

- Si la API externa **falla o no tiene créditos**, el sistema sigue funcionando con las **reglas locales**
- La detección no es 100% perfecta, pero cubre la gran mayoría de VPN/proxy/TOR comerciales
- El **GPS** ayuda a validar que el usuario está realmente donde dice estar
