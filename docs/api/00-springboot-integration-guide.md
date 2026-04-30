# Integración con Logto — Guía para Backend

**Referencias:**
- [Validate Access Tokens](https://docs.logto.io/authorization/validate-access-tokens)
- [Protect Spring Boot API](https://docs.logto.io/api-protection/java/spring-boot)
- [User Data Structure](https://docs.logto.io/docs/references/users/)
- [Custom JWT Claims](https://docs.logto.io/docs/recipes/custom-jwt/)

---

## Cómo funciona la autenticación

El frontend obtiene un **access token JWT** de Logto al iniciar sesión. En cada request al backend lo envía en el header:

```
Authorization: Bearer <access_token>
```

El backend valida ese JWT **localmente** usando las claves públicas de Logto (JWKS). No necesita llamar a Logto en cada request — solo descarga las claves una vez al arrancar y las cachea.

**Endpoints de Logto que el backend necesita conocer:**

| Propósito | URL |
|---|---|
| Discovery (todo en uno) | `https://auth.fondea.pe/oidc/.well-known/openid-configuration` |
| Claves públicas (JWKS) | `https://auth.fondea.pe/oidc/jwks` |
| Issuer | `https://auth.fondea.pe/oidc` |

Con Spring Security, solo se necesita configurar el `issuer-uri` y Spring descarga el resto automáticamente:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.fondea.pe/oidc
```

---

## Qué contiene el JWT

Cuando el backend decodifica el token recibe:

```json
{
  "sub": "i74ozbfy4chi",
  "iss": "https://auth.fondea.pe/oidc",
  "aud": "https://api.fondea.pe",
  "exp": 1714480000,
  "iat": 1714476400,
  "scope": "read:profile write:application",
  "client_id": "v8qywzzya03ic9dirgfk5"
}
```

El campo **`sub`** es el identificador único del usuario en Logto. Es el foreign key que conecta Logto con la base de datos del backend.

---

## Perfil de usuario — estructura en BD

Logto gestiona la identidad (email, contraseña, sesiones). El backend gestiona todo lo del negocio. El `sub` del JWT es el puente entre los dos.

```
Logto                          Base de datos del backend
─────────────────────          ──────────────────────────────────
sub: "i74ozbfy4chi"   ──────>  users.logto_id = "i74ozbfy4chi"
email                          users.email  (sincronizado)
name                           users.name   (sincronizado)
phone                          users.phone  (sincronizado)
                               users.id (UUID interno)
                                    │
                                    ├── kyc_data.user_id
                                    ├── labor_profiles.user_id
                                    ├── economic_profiles.user_id
                                    ├── references_profiles.user_id
                                    ├── address_profiles.user_id
                                    ├── bank_accounts.user_id
                                    └── applications.user_id
```

**Tabla `users` mínima:**

```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logto_id    VARCHAR(50) UNIQUE NOT NULL,  -- el "sub" del JWT
    email       VARCHAR(255),
    name        VARCHAR(255),
    phone       VARCHAR(20),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

En el primer request de un usuario nuevo, el backend crea el registro en `users` con el `logto_id` del JWT. En requests siguientes, lo busca por `logto_id`.

---

## Datos adicionales en el JWT (opcional)

Si se necesita incluir flags del negocio directamente en el token (ej: `kyc_verified`, `loan_status`), Logto permite agregar custom claims desde:

**Logto Console → Custom JWT → User access token**

```javascript
const getCustomJwtClaims = async ({ token, context, environmentVariables }) => {
  // Llamar al propio backend para obtener el estado del usuario
  const res = await fetch(
    `${environmentVariables.API_URL}/internal/users/${context.user.id}/claims`,
    { headers: { 'x-secret': environmentVariables.INTERNAL_SECRET } }
  );
  const data = await res.json();

  return {
    kyc_verified: data.kyc_verified,
    loan_status: data.loan_status,
  };
};
```

> ⚠️ No incluir datos sensibles (DNI, ingresos, deudas) en el JWT. El JWT es base64 — cualquiera puede decodificarlo. Solo flags y estados simples.

---

## Sobre la revocación de sesiones

Cuando un admin elimina una sesión desde Logto Console, el **refresh token queda inválido** inmediatamente. Sin embargo, el access token JWT ya emitido sigue siendo válido hasta que expire.

**Configuración recomendada:** access token de 15 minutos en Logto Console → Applications → tu app → Token settings. Así la ventana de riesgo es mínima sin infraestructura adicional.

Ver implementación futura con back-channel logout: [Logto Back-channel logout](https://docs.logto.io/docs/references/openid-connect/backchannel-logout/)
