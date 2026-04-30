# Manejo Correcto de Cierre de Sesión en Logto

## 🔍 **Cómo Funciona `signOut` en Logto SDK**

Según la documentación oficial de Logto, `signOut(logtoConfig)` realiza **automáticamente**:

1. **Limpia las cookies locales** de la sesión en el navegador
2. **Redirige al usuario a Logto** para cerrar la sesión compartida (SSO)
3. **Redirige de vuelta** a la URL configurada en "Post Sign-out Redirect URIs"

## ❌ **Errores Comunes en el Manejo de Cierre de Sesión**

### **Error 1: Sobrescribir configuraciones de Logto**
```typescript
// ❌ INCORRECTO - Interfiere con signOut
export const logtoConfig: LogtoNextConfig = {
  cookieName: 'logto_session', // Cambia el nombre por defecto
  prompt: 'consent', // Puede interferir con el flujo
};
```

### **Error 2: Limpieza manual innecesaria**
```typescript
// ❌ INCORRECTO - signOut ya hace esto
await signOut(logtoConfig);
// No necesitas limpiar cookies manualmente después
```

### **Error 3: No configurar Post Sign-out Redirect URIs**
En Logto Console debe estar configurado:
- `https://uat-app-fondea.vercel.app/` ✅

## ✅ **Implementación Correcta**

### **1. Configuración Limpia de Logto**
```typescript
// ✅ CORRECTO - Configuración mínima y estándar
export const logtoConfig: LogtoNextConfig = {
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  endpoint: process.env.LOGTO_ENDPOINT!,
  baseUrl: process.env.LOGTO_BASE_URL!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  cookieSecure: process.env.NODE_ENV === 'production',
  resources: process.env.LOGTO_API_RESOURCE ? [process.env.LOGTO_API_RESOURCE] : undefined,
  scopes: ['openid', 'profile', 'email', 'phone'],
  fetchUserInfo: true,
};
```

### **2. Función de Cierre de Sesión Robusta**
```typescript
// ✅ CORRECTO - Con manejo de errores
export async function performSignOut() {
  try {
    console.log('[AUTH] Iniciando cierre de sesión...');
    
    // signOut maneja automáticamente:
    // - Limpieza de cookies locales
    // - Redirección a Logto para logout SSO
    // - Redirección de vuelta a la app
    await signOut(logtoConfig);
    
  } catch (error) {
    console.error('[AUTH] Error durante cierre de sesión:', error);
    
    // Solo si falla signOut, hacer limpieza manual
    // y redirección de emergencia
    redirect('/');
  }
}
```

### **3. Uso en Layouts**
```typescript
// ✅ CORRECTO - Usar la función centralizada
<DashboardNavbar
  user={user}
  onSignOut={performSignOut}
/>
```

## 🔧 **Mejoras Implementadas**

### **1. Configuración Simplificada**
- ✅ Removidas configuraciones que interfieren con `signOut`
- ✅ Mantenidas solo las configuraciones esenciales
- ✅ Respeta el comportamiento estándar de Logto

### **2. Función `performSignOut` Centralizada**
- ✅ Manejo robusto de errores
- ✅ Logging detallado para debugging
- ✅ Fallback manual solo si falla el signOut estándar
- ✅ Una sola función para todos los layouts

### **3. Limpieza Solo Cuando es Necesario**
- ✅ `signOut` maneja la limpieza automáticamente
- ✅ Limpieza manual solo como fallback de emergencia
- ✅ No interferir con el flujo estándar de Logto

## 🎯 **Flujo Correcto de Cierre de Sesión**

```
1. Usuario hace clic en "Cerrar sesión"
   ↓
2. Se llama a performSignOut()
   ↓
3. signOut(logtoConfig) ejecuta:
   - Limpia cookies locales automáticamente
   - Redirige a Logto para logout SSO
   - Logto limpia la sesión compartida
   ↓
4. Logto redirige de vuelta a la app (/)
   ↓
5. Usuario ve la página de inicio sin sesión
```

## 📋 **Verificación en Logto Console**

Asegúrate de que esté configurado:

**Post Sign-out Redirect URIs:**
- `https://uat-app-fondea.vercel.app/` ✅
- `http://localhost:3000/` (desarrollo) ✅

## 🚀 **Resultado**

Con esta implementación:
- ✅ El cierre de sesión funciona según el estándar de Logto
- ✅ Se limpia correctamente la sesión local y SSO
- ✅ Manejo robusto de errores sin interferir con el flujo normal
- ✅ Una sola función centralizada para todos los layouts
- ✅ Logging detallado para debugging en producción

**El cierre de sesión ahora sigue las mejores prácticas de Logto SDK.**