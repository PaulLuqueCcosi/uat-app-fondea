# API de Notificaciones — Especificación Backend

## Resumen

El frontend necesita recibir notificaciones en tiempo real y poder listarlas/gestionarlas via REST. El backend **NO envía URLs** — solo el `type` + `metadata`. El frontend construye la navegación según el tipo.

---

## Modelo de datos (tabla `notifications`)

| Campo | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `user_id` | UUID | NO | — | FK a la tabla users (se extrae del JWT) |
| `type` | VARCHAR(50) | NO | — | Tipo de notificación (ver tabla abajo) |
| `title` | VARCHAR(100) | NO | — | Título corto |
| `message` | TEXT | NO | — | Mensaje descriptivo para el usuario |
| `priority` | VARCHAR(10) | NO | 'low' | `low`, `medium`, `high`, `urgent` |
| `is_read` | BOOLEAN | NO | false | Si el usuario ya la leyó |
| `metadata` | JSONB | SÍ | null | Datos extra según tipo (ver ejemplos) |
| `created_at` | TIMESTAMP | NO | now() | Fecha de creación |

**Índices sugeridos:**
- `idx_notifications_user_id` → (user_id, created_at DESC)
- `idx_notifications_unread` → (user_id, is_read) WHERE is_read = false

---

## Tipos de notificación

| type | Cuándo se genera | priority | metadata esperado |
|---|---|---|---|
| `APPLICATION_APPROVED` | Solicitud aprobada por el sistema | high | `{ "application_id": "uuid" }` |
| `APPLICATION_REJECTED` | Solicitud rechazada | high | `{ "application_id": "uuid", "reason": "..." }` |
| `APPLICATION_UPDATE` | Cambio de estado (PROCESSING, PENDING_DOCS, etc.) | medium | `{ "application_id": "uuid", "new_status": "..." }` |
| `PAYMENT_REMINDER` | 3 días antes del vencimiento | medium | `{ "credit_id": "uuid", "installment_number": 3, "due_date": "2026-07-01", "amount": 150 }` |
| `PAYMENT_OVERDUE` | Cuota vencida (día siguiente al vencimiento) | urgent | `{ "credit_id": "uuid", "installment_number": 3, "days_late": 1 }` |
| `PAYMENT_CONFIRMED` | Pago procesado exitosamente | low | `{ "credit_id": "uuid", "installment_number": 3, "amount": 150 }` |
| `SCORE_UPDATED` | Puntos del pasaporte cambiaron | low | `{ "points": 150, "previous_points": 100, "reason": "Pago puntual" }` |
| `LEVEL_UP` | Subió de nivel (ej: Bronce → Plata) | medium | `{ "new_level": "PLATA", "previous_level": "BRONCE" }` |
| `REFERRAL_COMPLETED` | Referido completó su préstamo | medium | `{ "referral_id": "uuid", "points_earned": 50 }` |
| `REFERRAL_REGISTERED` | Referido se registró | low | `{ "referral_id": "uuid" }` |
| `DOCUMENT_EXPIRED` | Documento por vencer o vencido | high | `{ "document_type": "DNI", "expires_at": "2026-08-01" }` |
| `KYC_VERIFIED` | Verificación KYC aprobada | medium | `{}` |
| `KYC_REJECTED` | Verificación KYC rechazada | high | `{ "reason": "Foto borrosa" }` |
| `CONTRACT_READY` | Contrato generado y listo para firmar | high | `{ "application_id": "uuid" }` |
| `DISBURSEMENT_COMPLETED` | Dinero desembolsado | high | `{ "credit_id": "uuid", "amount": 3000 }` |
| `SYSTEM_ANNOUNCEMENT` | Mantenimiento, cambios, noticias | low | `{ "announcement_id": "uuid" }` |

---

## REST Endpoints

Todos requieren `Authorization: Bearer <jwt>`. El `user_id` se extrae del token.

### 1. `GET /api/v1/notifications`

Lista todas las notificaciones del usuario, ordenadas por `created_at DESC`.

**Response 200:**
```json
[
  {
    "id": "550e8400-...",
    "type": "APPLICATION_APPROVED",
    "title": "¡Solicitud aprobada!",
    "message": "Tu préstamo de S/ 3,000 fue aprobado.",
    "priority": "high",
    "is_read": false,
    "metadata": { "application_id": "uuid-xxx" },
    "created_at": "2026-06-17T10:30:00"
  }
]
```

**Query params opcionales:**
- `?unread=true` — Solo no leídas
- `?limit=20` — Limitar resultados (default: 50)

---

### 2. `GET /api/v1/notifications/unread-count`

Solo el contador para el badge del navbar.

**Response 200:**
```json
{
  "unread_count": 3,
  "has_urgent": true
}
```

`has_urgent` = true si hay al menos una notificación no leída con `priority = 'urgent'`.

---

### 3. `PATCH /api/v1/notifications/{id}/read`

Marca una notificación como leída.

**Response:** 204 No Content

---

### 4. `PATCH /api/v1/notifications/read-all`

Marca TODAS las notificaciones del usuario como leídas.

**Response:** 204 No Content

---

## SSE Stream (Server-Sent Events)

### 5. `GET /api/v1/notifications/stream?token={jwt}`

Mantiene una conexión abierta. El token va como query param porque `EventSource` del browser no soporta headers custom.

**Validación:** Verificar el JWT en el query param. Si es inválido → cerrar conexión.

**Eventos que envía:**

```
event: notification
data: {"notification": {"id":"...","type":"APPLICATION_APPROVED","title":"...","message":"...","priority":"high","is_read":false,"metadata":{...},"created_at":"..."},"unread_count":4}

event: count_update
data: {"unread_count": 2}

event: heartbeat
data: {}
```

**Reglas:**
- Enviar `heartbeat` cada **30 segundos** para mantener la conexión viva
- Enviar `notification` cuando se crea una nueva notificación para ese user
- Enviar `count_update` cuando cambia el contador sin nueva notificación (ej: admin marca como leída)
- Si el token expira durante la conexión → enviar evento de cierre y cerrar

**Implementación en Spring:**
```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter stream(@RequestParam String token) {
    // Validar JWT
    // Crear SseEmitter con timeout de 5 min
    // Registrar emitter para el userId
    // Enviar heartbeat cada 30s
    // Cuando se crea notificación → emitir evento al emitter del user
}
```

---

## Cuándo crear notificaciones

| Evento en el sistema | Notificación a crear |
|---|---|
| `ApplicationService.approve()` | `APPLICATION_APPROVED` al usuario |
| `ApplicationService.reject()` | `APPLICATION_REJECTED` al usuario |
| `ApplicationService.updateStatus()` | `APPLICATION_UPDATE` al usuario |
| Cron 3 días antes de cuota | `PAYMENT_REMINDER` al usuario |
| Cron día después de vencimiento | `PAYMENT_OVERDUE` al usuario |
| `PaymentService.confirm()` | `PAYMENT_CONFIRMED` al usuario |
| `ScoreService.updatePoints()` | `SCORE_UPDATED` al usuario |
| `ScoreService.updatePoints()` si cambia de nivel | `LEVEL_UP` al usuario |
| `ReferralService.complete()` | `REFERRAL_COMPLETED` al referidor |
| `ReferralService.register()` | `REFERRAL_REGISTERED` al referidor |
| `KYCService.verify()` | `KYC_VERIFIED` al usuario |
| `KYCService.reject()` | `KYC_REJECTED` al usuario |
| `ContractService.generate()` | `CONTRACT_READY` al usuario |
| `DisbursementService.disburse()` | `DISBURSEMENT_COMPLETED` al usuario |

---

## Notas importantes

1. **El backend NO envía URLs** — solo `type` + `metadata`. El frontend decide a dónde navegar.
2. **El `metadata` es JSONB libre** — cada tipo tiene campos relevantes (ver tabla arriba).
3. **El `title` y `message` los define el backend** — son strings legibles para el usuario.
4. **Prioridad `urgent`** hace que el frontend muestre un indicador especial (badge rojo pulsante).
5. **Ordenar siempre por `created_at DESC`** en las queries.
6. **El SSE solo envía a usuarios conectados** — si no está conectado, la notificación se guarda y la verá cuando haga GET.
