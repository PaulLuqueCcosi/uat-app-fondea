# Backend API Specification — Fondea

Documentación técnica de los endpoints requeridos para el funnel de solicitud de préstamos.

## Índice

| # | Formulario | Archivo |
|---|---|---|
| 00 | Autenticación (común a todos) | [00-auth.md](./00-auth.md) |
| 01 | KYC / Verificación de identidad | [01-kyc.md](./01-kyc.md) |
| 02 | Perfil laboral | [02-labor.md](./02-labor.md) |
| 03 | Perfil económico | [03-economic.md](./03-economic.md) |
| 04 | Referencias personales | [04-references.md](./04-references.md) |
| 05 | Dirección + Ubigeo | [05-address.md](./05-address.md) |
| 06 | Cuenta bancaria | [06-bank-account.md](./06-bank-account.md) |
| 07 | Solicitud de préstamo | [07-application.md](./07-application.md) |

## Convenciones

- Todos los endpoints requieren `Authorization: Bearer <token>`
- Respuestas de error siguen el formato `{ "success": false, "error": "mensaje" }`
- Los IDs de arrays (deudas, ingresos adicionales) son UUIDs generados por el frontend
- Los campos `verified` y `overall_verified` los gestiona el backend
