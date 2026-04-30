# Autenticación

Todos los endpoints requieren autenticación Bearer Token (JWT de Logto):

```
Authorization: Bearer <access_token>
```

- Token obtenido del flujo OAuth2 con Logto
- Validar en cada request
- Responder `401 Unauthorized` si el token es inválido o expiró
