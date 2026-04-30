# 02 · Labor Profile (Perfil Laboral)

El perfil laboral se compone de 3 recursos independientes que se guardan por separado.
El estado global `overall_verified` es `true` solo cuando los 3 están verificados.

---

## GET /api/labor/status

Obtiene el estado completo del perfil laboral.

**Response:**
```json
{
  "situation": {
    "employment_status": "EMPLEADO_DEPENDIENTE",
    "verified": true
  },
  "details": {
    "industry": "TECNOLOGIA",
    "years_of_activity": 3,
    "verified": true
  },
  "income": {
    "monthly_income": 3500,
    "income_receipt_method": "CUENTA_BANCARIA",
    "has_additional_income": true,
    "additional_incomes": [
      {
        "id": "uuid-123",
        "type": "FREELANCE",
        "amount": 800,
        "description": "Proyectos web"
      }
    ],
    "verified": true
  },
  "overall_verified": true
}
```

- Cada sub-recurso puede ser `null` si aún no fue guardado
- `details` varía en campos según `employment_status`

---

## PUT /api/labor/situation

Guarda la situación laboral. Si cambia el tipo de empleo, invalida los detalles existentes.

**Request Body:**
```json
{
  "employment_status": "EMPLEADO_DEPENDIENTE"
}
```

**Response:**
```json
{ "success": true }
```

**Employment Status Enum:**

| Valor | Descripción |
|---|---|
| `EMPLEADO_DEPENDIENTE` | Empleado en planilla |
| `INDEPENDIENTE` | Trabajador independiente |
| `EMPRESARIO` | Dueño de negocio |
| `FREELANCE` | Freelancer / Consultor |

---

## PUT /api/labor/details

Guarda los detalles laborales. La estructura varía según el `employment_status` guardado previamente.

> ⚠️ Requiere que `/api/labor/situation` haya sido guardado primero.

**Request Body — EMPLEADO_DEPENDIENTE:**
```json
{
  "industry": "TECNOLOGIA",
  "years_of_activity": 3
}
```

**Request Body — INDEPENDIENTE:**
```json
{
  "industry": "SERVICIOS_PROFESIONALES",
  "years_of_activity": 5
}
```

**Request Body — FREELANCE:**
```json
{
  "industry": "TECNOLOGIA",
  "years_of_activity": 2
}
```

**Request Body — EMPRESARIO:**
```json
{
  "industry": "COMERCIO",
  "business_ruc": "20123456789",
  "years_of_activity": 7
}
```

**Response:**
```json
{ "success": true }
```

**Industry Enum:**

| Valor | Descripción |
|---|---|
| `TECNOLOGIA` | Tecnología |
| `SALUD` | Salud |
| `EDUCACION` | Educación |
| `CONSTRUCCION` | Construcción |
| `COMERCIO` | Comercio |
| `SERVICIOS_PROFESIONALES` | Servicios profesionales |
| `OTRO` | Otro |

**Validaciones por tipo:**

| Tipo | `industry` | `years_of_activity` | `business_ruc` |
|---|---|---|---|
| EMPLEADO_DEPENDIENTE | ✅ requerido | ✅ requerido (>= 0) | ❌ |
| INDEPENDIENTE | ✅ requerido | ✅ requerido (>= 0) | ❌ |
| FREELANCE | ✅ requerido | ✅ requerido (>= 0) | ❌ |
| EMPRESARIO | ✅ requerido | ✅ requerido (>= 0) | ✅ requerido (11 dígitos) |

---

## PUT /api/labor/income

Guarda los ingresos del usuario.

**Request Body:**
```json
{
  "monthly_income": 3500,
  "income_receipt_method": "CUENTA_BANCARIA",
  "has_additional_income": true,
  "additional_incomes": [
    {
      "id": "uuid-123",
      "type": "FREELANCE",
      "amount": 800,
      "description": "Proyectos web"
    },
    {
      "id": "uuid-456",
      "type": "OTRO",
      "custom_type": "Venta de productos",
      "amount": 500
    }
  ]
}
```

**Response:**
```json
{ "success": true }
```

**Campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `monthly_income` | number | ✅ | Mínimo S/ 500 |
| `income_receipt_method` | string | ✅ | Ver enum |
| `has_additional_income` | boolean | ✅ | — |
| `additional_incomes` | array | Si `has_additional_income: true` | Mínimo 1 elemento |

**Income Receipt Method Enum:**

| Valor | Descripción |
|---|---|
| `CUENTA_BANCARIA` | Cuenta bancaria |
| `EFECTIVO` | Efectivo |
| `BILLETERA_DIGITAL` | Billetera digital (Yape, Plin, etc.) |
| `OTROS` | Otro |

**Additional Income — campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | string | ✅ | UUID generado por el frontend |
| `type` | string | ✅ | Ver enum |
| `custom_type` | string | Si `type: "OTRO"` | Texto libre |
| `amount` | number | ✅ | > 0 |
| `description` | string | ❌ | Texto libre opcional |

**Additional Income Type Enum:**

| Valor | Descripción |
|---|---|
| `ALQUILER` | Alquiler de propiedad |
| `DIVIDENDOS` | Dividendos / inversiones |
| `PENSION` | Pensión |
| `FREELANCE` | Trabajo freelance |
| `NEGOCIO_SECUNDARIO` | Negocio secundario |
| `OTRO` | Otro (requiere `custom_type`) |

---

## PUT /api/labor/profile

Wrapper que guarda los 3 recursos en una sola llamada, en secuencia.
Si alguno falla, se detiene y retorna el error sin guardar los siguientes.

**Request Body:**
```json
{
  "situation": "EMPLEADO_DEPENDIENTE",
  "details": {
    "industry": "TECNOLOGIA",
    "years_of_activity": 3
  },
  "income": {
    "monthly_income": 3500,
    "income_receipt_method": "CUENTA_BANCARIA",
    "has_additional_income": false,
    "additional_incomes": []
  }
}
```

**Response:**
```json
{ "success": true }
```
