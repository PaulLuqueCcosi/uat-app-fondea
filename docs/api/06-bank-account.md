# 06 · Bank Account (Cuenta Bancaria)

---

## GET /api/bank-account/status

Obtiene el estado de la cuenta bancaria del usuario.

**Response:**
```json
{
  "profile": {
    "bank": "Banco de Crédito del Perú",
    "account_type": "AHORROS",
    "cci": "00219100123456789012",
    "verified": true
  },
  "overall_verified": true
}
```

- `profile` es `null` si el usuario aún no completó este formulario

---

## PUT /api/bank-account/profile

Guarda la cuenta bancaria para el desembolso del préstamo.

**Request Body:**
```json
{
  "bank": "Banco de Crédito del Perú",
  "account_type": "AHORROS",
  "cci": "00219100123456789012"
}
```

**Response:**
```json
{ "success": true }
```

**Campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `bank` | string | ✅ | Nombre del banco, no vacío |
| `account_type` | string | ✅ | `AHORROS` o `CORRIENTE` |
| `cci` | string | ✅ | Exactamente 20 dígitos numéricos |

**Account Type Enum:**

| Valor | Descripción |
|---|---|
| `AHORROS` | Cuenta de ahorros |
| `CORRIENTE` | Cuenta corriente |

**Nota sobre CCI:**
El CCI (Código de Cuenta Interbancario) peruano tiene 20 dígitos.
Formato: `BBBSSSCCCCCCCCCCCCCCd`
- `BBB` = código del banco (3 dígitos)
- `SSS` = código de la sucursal (3 dígitos)
- `CCCCCCCCCCCCCC` = número de cuenta (14 dígitos)
- `d` = dígito verificador (1 dígito)
