# KYC Validation API Integration

## Overview

El formulario de validación KYC se conecta a una API externa para verificar los datos del DNI contra los registros oficiales de RENIEC (Registro Nacional de Identificación y Estado Civil).

## Server Action: `verifyDNI`

### Ubicación
`app/actions/loan.actions.ts`

### Flujo de Validación

1. **Validaciones del lado del servidor**
   - Formato del DNI (8 dígitos numéricos)
   - Primer nombre (obligatorio, mínimo 2 caracteres)
   - Primer apellido (obligatorio, mínimo 2 caracteres)
   - Código de verificación (3 dígitos numéricos)

2. **Llamada a API externa**
   - Se llama a `validateWithExternalAPI()` que simula la integración con RENIEC
   - En producción, aquí iría la llamada real a la API de validación

3. **Procesamiento de respuesta**
   - Datos válidos: se guardan en la aplicación y se continúa al siguiente paso
   - Datos inválidos: se retorna error específico para mostrar al usuario

### Casos de Error Simulados

Para testing, el sistema simula diferentes escenarios:

| DNI | Resultado | Error Code |
|-----|-----------|------------|
| `00000000` | DNI no encontrado | `dni_not_found` |
| `11111111` | Datos no coinciden | `data_mismatch` |
| `22222222` | DNI con observaciones | `dni_with_issues` |
| `99999999` | Timeout de servicio | `service_timeout` |
| Código `000` | Código inválido | `invalid_verification_code` |

### Integración con API Real

Para conectar con la API real de RENIEC, descomenta y modifica esta sección en `validateWithExternalAPI()`:

```typescript
const response = await fetch('https://api-reniec.gob.pe/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.RENIEC_API_KEY}`,
  },
  body: JSON.stringify({
    dni: data.dni,
    firstName: data.firstName,
    firstLastName: data.firstLastName,
    verificationCode: data.verificationCode,
  }),
});

if (!response.ok) {
  throw new Error(`API Error: ${response.status}`);
}

const result = await response.json();
return result;
```

### Variables de Entorno Requeridas

```env
RENIEC_API_KEY=your_api_key_here
RENIEC_API_URL=https://api-reniec.gob.pe
```

## Estructura de Datos

### Input (KYCData)
```typescript
interface KYCData {
  dni: string;                    // 8 dígitos
  firstName: string;              // Primer nombre (obligatorio)
  secondName?: string;            // Segundo nombre (opcional)
  firstLastName: string;          // Primer apellido (obligatorio)
  secondLastName?: string;        // Segundo apellido (opcional)
  verificationCode: string;       // 3 dígitos
}
```

### Output
```typescript
{
  success: boolean;
  error?: string;        // Mensaje de error para el usuario
  errorCode?: string;    // Código de error para manejo programático
}
```

## Manejo de Errores en el Frontend

El componente `FunnelKYCValidation` maneja los errores de la siguiente manera:

1. **Estados de carga**: Muestra spinner y deshabilita el formulario durante la validación
2. **Errores específicos**: Muestra mensajes de error detallados basados en el `errorCode`
3. **Scroll automático**: Lleva al usuario al mensaje de error para mejor UX
4. **Consejos de resolución**: Proporciona tips para resolver problemas comunes

## Testing

Usa la página `/test-kyc` para probar diferentes escenarios:

- **DNI válido**: `12345678` con nombres `JUAN CARLOS`, apellidos `PÉREZ GARCÍA`, código `123`
- **Errores simulados**: Usa los DNIs especiales listados arriba
- **Validación de campos**: Prueba con datos inválidos para ver las validaciones del lado cliente

## Seguridad

- Todas las validaciones se ejecutan tanto en cliente como servidor
- Los datos se sanitizan antes de enviar a la API
- Se implementa rate limiting para prevenir abuso
- Los logs no incluyen información sensible completa

## Monitoreo

Se recomienda implementar:

- Logging de intentos de validación
- Métricas de éxito/fallo de la API
- Alertas por timeouts o errores frecuentes
- Dashboard de salud del servicio de validación