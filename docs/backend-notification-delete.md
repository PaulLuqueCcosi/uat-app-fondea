# Endpoint: Eliminar notificación

## `DELETE /api/v1/notifications/{id}`

**Descripción:** Elimina (soft delete) una notificación del usuario autenticado.

**Autenticación:** Bearer JWT. El `user_id` se extrae del token.

**Validación:** Verificar que la notificación pertenezca al usuario del token. Si no → 404.

---

### Responses

| Status | Cuándo |
|---|---|
| 204 | Eliminada correctamente (sin body) |
| 401 | Token inválido o expirado |
| 404 | Notificación no existe o no pertenece al usuario |

---

### Ejemplo

```
DELETE /api/v1/notifications/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt>

→ 204 No Content
```

---


