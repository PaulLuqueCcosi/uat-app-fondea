# API de Intenciones — Especificación para el Backend

Las intenciones representan la configuración de préstamo que un usuario selecciona antes de iniciar el funnel de solicitud. Se generan en la landing (calculadora externa) o en la calculadora interna del sistema.

Todos los endpoints requieren autenticación Bearer token (Logto).

---

## Autenticación

```
Authorization: Bearer <access_token>
```

El backend identifica al usuario a partir del token. No se requiere pasar el `userId` en el body.

---

## Endpoints

### GET /api/v1/intentions/active

Obtiene la intención activa del usuario autenticado. Solo puede haber una intención activa por usuario a la vez.

**Response 200**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 5000,
  "months": 12,
  "monthlyPayment": 456.23,
  "monthlyRate": 3.5,
  "createdAt": "2026-05-02T10:00:00Z",
  "updatedAt": "2026-05-02T10:00:00Z"
}
```

**Response 404** — el usuario no tiene intención activa
```json
{
  "error": "No active intention found"
}
```

---

### GET /api/v1/intentions/:id

Obtiene una intención específica por ID. Solo retorna la intención si pertenece al usuario autenticado.

**Response 200** — misma estructura que `/active`

**Response 404** — no existe o no pertenece al usuario
```json
{
  "error": "Intention not found"
}
```

---

### POST /api/v1/intentions/:id/register

Registra una intención existente (generada en la landing externa) al usuario autenticado. Si el usuario ya tiene esa intención registrada, la retorna sin duplicar.

**Body** — vacío (el ID viene en la URL, el usuario del token)

**Response 200** — intención ya existente, retorna sin cambios
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 10000,
  "months": 24,
  "monthlyPayment": 589.45,
  "monthlyRate": 3.5,
  "tea": 51.1,
  "createdAt": "2026-05-02T10:00:00Z",
  "updatedAt": "2026-05-02T10:00:00Z"
}
```

**Response 201** — intención registrada por primera vez
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 10000,
  "months": 24,
  "monthlyPayment": 589.45,
  "monthlyRate": 3.5,
  "tea": 51.1,
  "createdAt": "2026-05-02T10:00:00Z",
  "updatedAt": "2026-05-02T10:00:00Z"
}
```

**Response 404** — el ID no existe en el sistema (la landing no lo generó)
```json
{
  "error": "Intention not found"
}
```

---

### POST /api/v1/intentions

Crea una nueva intención desde la calculadora interna. Si el usuario ya tiene una intención activa, la reemplaza.

**Body**
```json
{
  "amount": 5000,
  "months": 12
}
```

| Campo    | Tipo    | Requerido | Descripción                        |
|----------|---------|-----------|------------------------------------|
| `amount` | integer | ✅        | Monto en soles. Mín: 500, Máx: 50000 |
| `months` | integer | ✅        | Número de cuotas. Valores: 6, 12, 18, 24, 36 |

**Response 201**
```json
{
  "id": "nuevo-uuid-generado",
  "amount": 5000,
  "months": 12,
  "monthlyPayment": 456.23,
  "monthlyRate": 3.5,
  "tea": 51.1,
  "createdAt": "2026-05-02T10:00:00Z",
  "updatedAt": "2026-05-02T10:00:00Z"
}
```

**Response 422** — validación fallida
```json
{
  "error": "Invalid amount or months",
  "details": {
    "amount": "Must be between 500 and 50000",
    "months": "Must be one of: 6, 12, 18, 24, 36"
  }
}
```

---

### PUT /api/v1/intentions/:id

Actualiza el monto y/o plazo de una intención existente. Solo puede editar el usuario dueño de la intención. No se puede editar una intención si ya tiene una solicitud enviada asociada.

**Body**
```json
{
  "amount": 8000,
  "months": 18
}
```

**Response 200**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 8000,
  "months": 18,
  "monthlyPayment": 534.12,
  "monthlyRate": 3.5,
  "tea": 51.1,
  "createdAt": "2026-05-02T10:00:00Z",
  "updatedAt": "2026-05-02T11:30:00Z"
}
```

**Response 404** — no existe o no pertenece al usuario

**Response 409** — la intención ya tiene una solicitud enviada y no puede editarse
```json
{
  "error": "Intention is locked. A submitted application is associated with it."
}
```

---

### DELETE /api/v1/intentions/:id

Elimina una intención. Solo puede eliminarla el usuario dueño. No se puede eliminar si tiene una solicitud enviada asociada.

**Response 204** — eliminada correctamente, sin body

**Response 404** — no existe o no pertenece al usuario

**Response 409** — tiene solicitud asociada, no se puede eliminar
```json
{
  "error": "Intention is locked. A submitted application is associated with it."
}
```

---


## Notas de integración

- El frontend guarda el `id` de la intención en `localStorage` bajo la clave `fondea_intencion_id`.
- El card del sidebar llama a `GET /api/v1/intentions/active` en cada carga del funnel para mostrar los datos frescos.
- Al registrar una intención desde la landing (`POST /register`), el backend debe validar que el ID exista en su sistema antes de asociarlo al usuario.
- Una intención queda **bloqueada** (no editable ni eliminable) cuando el usuario envía la solicitud (`POST /api/v1/applications/submit`).

---

## Mapeo con el frontend

| Server Action frontend          | Endpoint backend                          |
|---------------------------------|-------------------------------------------|
| `getActiveIntencion()`          | `GET /api/v1/intentions/active`           |
| `getIntencionConfig(id)`        | `GET /api/v1/intentions/:id`              |
| `registerIntencion(id)`         | `POST /api/v1/intentions/:id/register`    |
| `createIntencion(amount, months)` | `POST /api/v1/intentions`               |
| `updateIntencion(id, amount, months)` | `PUT /api/v1/intentions/:id`        |
| `deleteIntencion(id)`           | `DELETE /api/v1/intentions/:id`           |

Los TODOs en `app/actions/intencion.actions.ts` indican exactamente dónde descomentar el código para conectar cada endpoint.
