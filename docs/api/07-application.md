# 07 · Application (Solicitud de Préstamo)

---

## POST /api/applications/submit

Envía la solicitud completa para evaluación. El backend inicia el proceso de forma asíncrona.

**Request Body:**
```json
{
  "pep_declarations": {
    "not_pep": true,
    "not_pep_relative": true,
    "accept_terms": true
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "applicationId": "app_123456789",
  "status": "evaluating"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `pep_declarations.not_pep` | boolean | ✅ | Declara no ser Persona Expuesta Políticamente |
| `pep_declarations.not_pep_relative` | boolean | ✅ | Declara no tener familiares PEP |
| `pep_declarations.accept_terms` | boolean | ✅ | Acepta términos y condiciones |

**Validaciones previas (el backend debe verificar):**
- Todos los formularios del funnel están completados y verificados (KYC, labor, economic, references, address, bank-account)
- Los tres `pep_declarations` deben ser `true`

**Comportamiento:**
- Si el usuario ya tiene una solicitud activa (`submitted` o `evaluating`), retorna el `applicationId` existente sin crear una nueva
- La evaluación es asíncrona — el frontend hace polling a `GET /api/applications/{id}/status`
- Si fue rechazada, `canRetryAt` indica cuándo puede volver a intentarlo (30 días)

---

## GET /api/applications

Lista todas las solicitudes del usuario autenticado, ordenadas de más reciente a más antigua.

**Response:**
```json
{
  "applications": [
    {
      "id": "app_123456789",
      "status": "approved",
      "result": "approved",
      "submittedAt": "2024-04-30T10:00:00Z",
      "evaluatedAt": "2024-04-30T10:05:00Z",
      "canRetryAt": null
    },
    {
      "id": "app_987654321",
      "status": "rejected",
      "result": "rejected",
      "submittedAt": "2024-03-01T08:00:00Z",
      "evaluatedAt": "2024-03-01T08:10:00Z",
      "canRetryAt": "2024-04-01T08:10:00Z"
    }
  ],
  "total": 2
}
```

- Retorna `applications: []` si el usuario no tiene solicitudes
- Solo retorna solicitudes del usuario autenticado

---

## GET /api/applications/active

Obtiene la solicitud activa del usuario (la más reciente en estado no terminal).

**Response — con solicitud activa:**
```json
{
  "id": "app_123456789",
  "status": "evaluating",
  "result": null,
  "submittedAt": "2024-04-30T10:00:00Z",
  "evaluatedAt": null,
  "canRetryAt": null
}
```

**Response — sin solicitud activa:**
```json
null
```

Estados considerados "activos": `submitted`, `evaluating`, `approved`, `more_info`, `signed`, `disbursing`

---

## GET /api/applications/{id}

Obtiene el detalle completo de una solicitud específica.

**Response:**
```json
{
  "id": "app_123456789",
  "status": "approved",
  "result": "approved",
  "submittedAt": "2024-04-30T10:00:00Z",
  "evaluatedAt": "2024-04-30T10:05:00Z",
  "canRetryAt": null
}
```

**Seguridad:**
- Solo el dueño puede consultar su solicitud
- Retorna `404` si el `id` no existe o no pertenece al usuario autenticado

---

## GET /api/applications/{id}/status

Consulta solo el estado de una solicitud. Usado para polling durante la evaluación.

**Response:**
```json
{
  "status": "evaluating",
  "result": null,
  "canRetryAt": null
}
```

**Ejemplos por estado:**

```json
{ "status": "approved",  "result": "approved",  "canRetryAt": null }
{ "status": "rejected",  "result": "rejected",  "canRetryAt": "2024-05-30T10:00:00Z" }
{ "status": "more_info", "result": "more_info", "canRetryAt": null }
```

---

## Modelo de datos — ApplicationRecord

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | ID único de la solicitud |
| `status` | ApplicationStatus | Estado actual |
| `result` | EvaluationResult \| null | Resultado de la evaluación |
| `submittedAt` | string (ISO) | Cuándo se envió |
| `evaluatedAt` | string (ISO) \| null | Cuándo se evaluó |
| `canRetryAt` | string (ISO) \| null | Cuándo puede reintentar (solo si rechazada) |

**ApplicationStatus Enum:**

| Valor | Descripción |
|---|---|
| `draft` | Borrador, no enviada |
| `submitted` | Enviada, pendiente de evaluación |
| `evaluating` | En proceso de evaluación |
| `approved` | Aprobada |
| `more_info` | Requiere información adicional |
| `rejected` | Rechazada |
| `signed` | Contrato firmado |
| `disbursing` | En proceso de desembolso |

**EvaluationResult Enum:**

| Valor | Descripción |
|---|---|
| `approved` | Aprobada |
| `rejected` | Rechazada |
| `more_info` | Requiere más información |
