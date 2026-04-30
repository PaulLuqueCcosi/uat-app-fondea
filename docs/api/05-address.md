# 05 · Address Profile (Dirección)

---

## GET /api/additional/status

Obtiene el estado del perfil de dirección del usuario.

**Response:**
```json
{
  "profile": {
    "address_type": "google",
    "google_address": "Av. Javier Prado Este 1234, San Isidro, Lima, Perú",
    "region": "15",
    "province": "1501",
    "district": "150131",
    "referral_source": "REDES_SOCIALES",
    "verified": true
  },
  "overall_verified": true
}
```

- `profile` es `null` si el usuario aún no completó este formulario
- `google_address` presente solo si `address_type: "google"`
- `street_address` presente solo si `address_type: "manual"`

---

## POST /api/additional

Guarda la dirección del usuario. Soporta dos modos: dirección desde Google Places o ingreso manual.

**Request Body — modo Google:**
```json
{
  "address_type": "google",
  "google_address": "Av. Javier Prado Este 1234, San Isidro, Lima, Perú",
  "region": "15",
  "province": "1501",
  "district": "150131",
  "referral_source": "REDES_SOCIALES"
}
```

**Request Body — modo manual:**
```json
{
  "address_type": "manual",
  "street_address": "Jr. Los Olivos 123",
  "region": "15",
  "province": "1501",
  "district": "150131",
  "referral_source": "OTRO",
  "referral_other": "Recomendación de familiar"
}
```

**Response:**
```json
{ "success": true }
```

**Campos:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `address_type` | string | ✅ | `"google"` o `"manual"` |
| `google_address` | string | Si `address_type: "google"` | Texto completo de la dirección |
| `street_address` | string | Si `address_type: "manual"` | Calle y número, no vacío |
| `region` | string | ✅ | ID de departamento (ubigeo) |
| `province` | string | ✅ | ID de provincia (ubigeo) |
| `district` | string | ✅ | ID de distrito (ubigeo) |
| `referral_source` | string | ✅ | Ver enum |
| `referral_other` | string | Si `referral_source: "OTRO"` | Texto libre |

**Referral Source Enum:**

| Valor | Descripción |
|---|---|
| `REDES_SOCIALES` | Redes sociales |
| `RECOMENDACION` | Recomendación de un amigo |
| `GOOGLE` | Google / Buscador |
| `PUBLICIDAD` | Publicidad (TV, radio, etc.) |
| `OTRO` | Otro (requiere `referral_other`) |

---

## GET /api/ubigeo/regions

Lista todos los departamentos del Perú.

**Response:**
```json
[
  { "id": "15", "name": "LIMA" },
  { "id": "04", "name": "AREQUIPA" }
]
```

---

## GET /api/ubigeo/provinces?region={regionId}

Lista las provincias de un departamento.

**Response:**
```json
[
  { "id": "1501", "name": "LIMA", "region_id": "15" },
  { "id": "1502", "name": "BARRANCA", "region_id": "15" }
]
```

---

## GET /api/ubigeo/districts?province={provinceId}

Lista los distritos de una provincia.

**Response:**
```json
[
  { "id": "150131", "name": "SAN ISIDRO", "province_id": "1501" },
  { "id": "150132", "name": "MIRAFLORES", "province_id": "1501" }
]
```
