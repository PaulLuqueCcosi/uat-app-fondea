# 03 · Economic Profile (Perfil Económico)

---

## GET /api/economic/status

Obtiene el estado del perfil económico del usuario.

**Response:**
```json
{
  "profile": {
    "loan_purpose": "EDUCACION",
    "monthly_expenses": 2500,
    "has_debts": true,
    "debts": [
      {
        "id": "uuid-1",
        "entity": "Banco de Crédito",
        "type": "Tarjeta de Crédito",
        "amount": 5000,
        "monthlyPayment": 300
      }
    ],
    "has_property": true,
    "has_vehicle": false,
    "has_services": true,
    "education_level": "UNIVERSITARIA",
    "verified": true
  },
  "overall_verified": true
}
```

- `profile` es `null` si el usuario aún no completó este formulario
- `debts` es `[]` cuando `has_debts: false`

---

## PUT /api/economic/profile

Guarda el perfil económico del usuario.

**Request Body:**
```json
{
  "loan_purpose": "EDUCACION",
  "monthly_expenses": 2500,
  "has_debts": true,
  "debts": [
    {
      "id": "uuid-1",
      "entity": "Banco de Crédito",
      "type": "Tarjeta de Crédito",
      "amount": 5000,
      "monthlyPayment": 300
    }
  ],
  "has_property": true,
  "has_vehicle": false,
  "has_services": true,
  "education_level": "UNIVERSITARIA"
}
```

**Response:**
```json
{ "success": true }
```

**Campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `loan_purpose` | string | ✅ | Ver enum |
| `monthly_expenses` | number | ✅ | >= 0 |
| `has_debts` | boolean | ✅ | — |
| `debts` | array | Si `has_debts: true` | Mínimo 1 elemento |
| `has_property` | boolean | ✅ | — |
| `has_vehicle` | boolean | ✅ | — |
| `has_services` | boolean | ✅ | — |
| `education_level` | string | ✅ | Ver enum |

**Debt — campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | string | ✅ | UUID generado por el frontend |
| `entity` | string | ✅ | Nombre de la entidad, no vacío |
| `type` | string | ✅ | Texto libre (ej: "Tarjeta de Crédito") |
| `amount` | number | ✅ | > 0 |
| `monthlyPayment` | number | ✅ | > 0 |

**Loan Purpose Enum:**

| Valor | Descripción |
|---|---|
| `EDUCACION` | Educación |
| `SALUD` | Salud / Emergencia médica |
| `NEGOCIO` | Capital de negocio |
| `VIAJE` | Viaje |
| `HOGAR` | Mejoras del hogar |
| `DEUDAS` | Pagar deudas |
| `OTRO` | Otro |

**Education Level Enum:**

| Valor | Descripción |
|---|---|
| `PRIMARIA` | Primaria |
| `SECUNDARIA` | Secundaria |
| `TECNICA` | Técnica / Superior no universitaria |
| `UNIVERSITARIA` | Universitaria |
| `POSGRADO` | Posgrado / Maestría / Doctorado |
| `OTRO` | Otro |
