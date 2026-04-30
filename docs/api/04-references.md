# 04 · References (Referencias Personales)

---

## GET /api/references/status

Obtiene el estado de las referencias del usuario.

**Response:**
```json
{
  "profile": {
    "family_reference": {
      "name": "María Pérez",
      "phone": "987654321",
      "relationship": "HERMANO",
      "relationship_other": null
    },
    "non_family_reference": {
      "name": "Carlos López",
      "phone": "912345678",
      "relationship": "OTRO",
      "relationship_other": "Compañero de gym",
      "years_known": 8
    },
    "verified": true
  },
  "overall_verified": true
}
```

- `profile` es `null` si el usuario aún no completó este formulario
- `relationship_other` solo tiene valor cuando `relationship === "OTRO"`

---

## PUT /api/references/profile

Guarda las dos referencias del usuario.

**Request Body:**
```json
{
  "family_reference": {
    "name": "María Pérez",
    "phone": "987654321",
    "relationship": "HERMANO"
  },
  "non_family_reference": {
    "name": "Carlos López",
    "phone": "912345678",
    "relationship": "OTRO",
    "relationship_other": "Compañero de gym",
    "years_known": 8
  }
}
```

**Response:**
```json
{ "success": true }
```

**family_reference — campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `name` | string | ✅ | Mínimo 3 caracteres |
| `phone` | string | ✅ | Empieza con `9`, exactamente 9 dígitos |
| `relationship` | string | ✅ | Ver enum |
| `relationship_other` | string | Si `relationship: "OTRO"` | Texto libre |

**non_family_reference — campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `name` | string | ✅ | Mínimo 3 caracteres |
| `phone` | string | ✅ | Empieza con `9`, exactamente 9 dígitos |
| `relationship` | string | ✅ | Ver enum |
| `relationship_other` | string | Si `relationship: "OTRO"` | Texto libre |
| `years_known` | number | ✅ | Mínimo 1 año |

**Family Relationship Enum:**

| Valor | Descripción |
|---|---|
| `MADRE` | Madre |
| `PADRE` | Padre |
| `HERMANO` | Hermano/a |
| `HIJO` | Hijo/a |
| `CONYUGE` | Cónyuge |
| `TIO` | Tío/a |
| `PRIMO` | Primo/a |
| `ABUELO` | Abuelo/a |
| `OTRO` | Otro (requiere `relationship_other`) |

**Non-Family Relationship Enum:**

| Valor | Descripción |
|---|---|
| `COLEGA` | Colega |
| `AMIGO` | Amigo/a |
| `VECINO` | Vecino/a |
| `CONOCIDO` | Conocido/a |
| `OTRO` | Otro (requiere `relationship_other`) |

**Validaciones cruzadas:**
- Los teléfonos de ambas referencias no pueden ser iguales
