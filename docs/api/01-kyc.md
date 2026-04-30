# 01 · KYC Validation (Verificación de Identidad)

## POST /api/kyc/validate

Valida los datos de identidad del usuario contra RENIEC y los guarda si son correctos.

**Request Body:**
```json
{
  "dni": "12345678",
  "firstName": "JUAN",
  "secondName": "CARLOS",
  "firstLastName": "PEREZ",
  "secondLastName": "GARCIA",
  "verificationCode": "5",
  "birth_date": "1990-05-15"
}
```

**Response 200 — Éxito:**
```json
{
  "success": true
}
```

**Response 400 — Datos incorrectos:**
```json
{
  "success": false,
  "error": "Los datos no coinciden con los registros. Te quedan 2 intentos.",
  "attemptsLeft": 2,
  "fieldErrors": {
    "firstName": "El nombre no coincide con RENIEC",
    "verificationCode": "El código de verificación es incorrecto"
  }
}
```

**Response 429 — Usuario bloqueado:**
```json
{
  "success": false,
  "blocked": true,
  "blockedHoursLeft": 24,
  "error": "Demasiados intentos fallidos. Podrás intentarlo nuevamente en 24 horas."
}
```

**Campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `dni` | string | ✅ | Exactamente 8 dígitos numéricos |
| `firstName` | string | ✅ | Solo letras, mínimo 2 caracteres |
| `secondName` | string | ❌ | Solo letras si se envía |
| `firstLastName` | string | ✅ | Solo letras, mínimo 2 caracteres |
| `secondLastName` | string | ❌ | Solo letras si se envía |
| `verificationCode` | string | ✅ | Exactamente 1 dígito numérico |
| `birth_date` | string | ✅ | Formato ISO `YYYY-MM-DD`, edad entre 21-65 años |

**Lógica de intentos:**
- Máximo 3 intentos por usuario
- Al agotar intentos: bloqueo de 24 horas
- Reset de contador al validar exitosamente

---

## GET /api/kyc/status

Obtiene el estado actual de verificación KYC del usuario.

**Response:**
```json
{
  "data": {
    "dni": "12345678",
    "firstName": "JUAN",
    "secondName": "CARLOS",
    "firstLastName": "PEREZ",
    "secondLastName": "GARCIA",
    "verificationCode": "5",
    "birth_date": "1990-05-15",
    "verified": true
  },
  "blocked": false,
  "blockedHoursLeft": 0,
  "attemptsLeft": 3
}
```

- `data` es `null` si el usuario aún no ha completado KYC
- `blocked: true` cuando el usuario agotó sus intentos
- `attemptsLeft` indica cuántos intentos quedan antes del bloqueo
