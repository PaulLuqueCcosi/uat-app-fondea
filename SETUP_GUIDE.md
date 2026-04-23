# Guía de Configuración - Fondea Next.js

## 🚀 Setup Inicial (5 minutos)

### Paso 1: Instalar Dependencias

```bash
cd app_fondea_pe
npm install
```

**Dependencias instaladas:**
- `@logto/next` - SDK oficial de Logto
- `lucide-react` - Iconos
- Next.js 16.2.4
- Tailwind CSS v4

---

### Paso 2: Configurar Variables de Entorno

#### 2.1 Crear archivo `.env.local`

```bash
cp .env.example .env.local
```

#### 2.2 Editar `.env.local` con tus credenciales:

```env
# App ID de tu aplicación Logto
LOGTO_APP_ID=dgbvyv7y3spntl7gi76rz

# App Secret (obtener de Logto Console)
LOGTO_APP_SECRET=tu-app-secret-aqui

# Endpoint de Logto (local o cloud)
LOGTO_ENDPOINT=http://localhost:3001

# URL base de tu aplicación Next.js
LOGTO_BASE_URL=http://localhost:3000

# Cookie secret (generar con el comando abajo)
LOGTO_COOKIE_SECRET=

# API Resource (opcional)
LOGTO_API_RESOURCE=http://localhost:8080
```

#### 2.3 Generar Cookie Secret

**En Linux/Mac:**
```bash
openssl rand -hex 32
```

**En Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**En Windows (Git Bash):**
```bash
openssl rand -hex 32
```

Copia el resultado y pégalo en `LOGTO_COOKIE_SECRET`.

---

### Paso 3: Configurar Logto Console

#### 3.1 Crear Aplicación en Logto

1. Ve a **Logto Console** → Applications
2. Click en "Create Application"
3. Selecciona **Traditional Web App**
4. Nombre: "Fondea Next.js"

#### 3.2 Configurar Redirect URIs

En la configuración de tu aplicación Logto:

**Sign-in redirect URIs:**
```
http://localhost:3000/api/logto/callback
```

**Post sign-out redirect URIs:**
```
http://localhost:3000
```

**CORS allowed origins:**
```
http://localhost:3000
```

#### 3.3 Obtener Credenciales

- Copia el **App ID**
- Copia el **App Secret**
- Pégalos en tu `.env.local`

---

### Paso 4: Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 🧪 Testing del Setup

### Test 1: Home Page

1. Abre `http://localhost:3000`
2. **Deberías ver:**
   - Landing page de Fondea
   - Header con logo
   - Botón "Iniciar sesión"
   - Hero section

### Test 2: Autenticación

1. Click en "Iniciar sesión" o "Comenzar ahora"
2. **Deberías ser redirigido a:**
   - Página de login de Logto
3. Inicia sesión con tus credenciales
4. **Deberías ser redirigido a:**
   - `/dashboard` (página de inicio del dashboard)

### Test 3: Dashboard

1. **Verifica que se muestre:**
   - Tu nombre de usuario
   - Barra de progreso del perfil (20%)
   - Card "Mi Expediente" con 5 secciones
   - Card "Mis Solicitudes"
   - Sidebar con navegación
   - Navbar con notificaciones

2. **Prueba la navegación:**
   - Click en secciones del expediente
   - Click en "Mi Perfil", "Mis Solicitudes", "Configuración"
   - Colapsa/expande el sidebar

### Test 4: Funnel - Perfil Laboral

#### Modo Dashboard:

1. Ve a `/dashboard/section/labor`
2. **Deberías ver:**
   - Formulario de perfil laboral
   - Campos: situación laboral, sector, ingresos
   - StickyBottomBar en la parte inferior
   - Botón "Guardar y volver al dashboard"

#### Modo Funnel:

1. Ve a `/funnel/labor`
2. **Deberías ver:**
   - Mismo formulario
   - Botón "Siguiente →" dentro del card
   - Sin StickyBottomBar

3. **Llena el formulario:**
   - Selecciona situación laboral
   - Selecciona sector
   - Ingresa ingreso mensual (mínimo S/ 500)
   - Click en "Siguiente"

4. **Verifica:**
   - Navegación a `/funnel/economic`
   - En consola del servidor: `[MOCK] Perfil laboral guardado`

### Test 5: Logout

1. Click en el icono de logout (puerta con flecha) en el navbar
2. **Deberías:**
   - Ser redirigido a la home page
   - Ya no tener acceso a `/dashboard` sin login

---

## 🐛 Troubleshooting

### Error: "Cookie secret must be at least 32 characters"

**Solución:** Regenera el `LOGTO_COOKIE_SECRET` con el comando:
```bash
openssl rand -hex 32
```

### Error: "redirect_uri_mismatch"

**Solución:** Verifica en Logto Console que el redirect URI sea exactamente:
```
http://localhost:3000/api/logto/callback
```

### Error: "Invalid client credentials"

**Solución:** 
1. Verifica que `LOGTO_APP_ID` y `LOGTO_APP_SECRET` sean correctos
2. Asegúrate de que no haya espacios extra
3. Reinicia el servidor: `npm run dev`

### Error: No se puede conectar a Logto

**Solución:**
1. Verifica que Logto esté corriendo en `http://localhost:3001`
2. O actualiza `LOGTO_ENDPOINT` con tu URL de Logto Cloud

### Página en blanco después de login

**Solución:**
1. Abre las DevTools (F12)
2. Verifica la consola de errores
3. Verifica que la cookie `logto-session` esté presente (Application → Cookies)
4. Si no hay cookie, revisa el `LOGTO_COOKIE_SECRET`

### Build Error

**Solución:**
```bash
# Limpiar cache
rm -rf .next
npm run build
```

---

## 📝 Comandos Útiles

### Desarrollo
```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
```

### Logs y Debugging

#### Ver logs de Server Actions:

Los Server Actions imprimen logs en la **consola del servidor** (no del navegador).

Busca en la terminal donde corre `npm run dev`:
```
[MOCK] Perfil laboral guardado: { situation: 'EMPLEADO_DEPENDIENTE', ... }
[MOCK] Simulación actualizada: { amount: 10000, months: 12 }
```

#### Ver datos de usuario:

En cualquier componente cliente:
```typescript
console.log('User data:', user);
```

En Server Components o Server Actions:
```typescript
const user = await getUser();
console.log('User from server:', user);
```

---

## 🔧 Configuración Adicional

### Puerto Personalizado

Si el puerto 3000 está ocupado:

```bash
PORT=3001 npm run dev
```

**Importante:** Actualiza también:
- `LOGTO_BASE_URL` en `.env.local`
- Redirect URIs en Logto Console

### TypeScript Strict Mode

El proyecto usa TypeScript strict. Si necesitas relajar las reglas:

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

### ESLint

Personalizar reglas en `eslint.config.mjs`.

---

## 🌐 Deployment

### Vercel (Recomendado)

1. **Push a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin tu-repo-url
   git push -u origin main
   ```

2. **Conectar con Vercel:**
   - Ve a https://vercel.com
   - Click "Import Project"
   - Selecciona tu repo

3. **Configurar Variables de Entorno:**
   - En Vercel Dashboard → Settings → Environment Variables
   - Agrega todas las variables de `.env.local`
   - **IMPORTANTE:** Actualiza `LOGTO_BASE_URL` con tu dominio de Vercel

4. **Actualizar Logto Console:**
   - Redirect URI: `https://tu-dominio.vercel.app/api/logto/callback`
   - Post sign-out: `https://tu-dominio.vercel.app`

### Otras Plataformas

#### Netlify
```bash
npm run build
# Deploy carpeta .next
```

#### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 📚 Recursos Adicionales

- **Plan de Implementación:** `C:\Users\paull\.claude\plans\claude-esto-es-muy-radiant-pascal.md`
- **Resumen de Implementación:** `IMPLEMENTATION_SUMMARY.md`
- **Next.js Docs:** https://nextjs.org/docs
- **Logto Docs:** https://docs.logto.io
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## ✅ Checklist de Setup

- [ ] Dependencias instaladas (`npm install`)
- [ ] `.env.local` creado y configurado
- [ ] Cookie secret generado (32+ caracteres)
- [ ] Aplicación Logto creada
- [ ] Redirect URIs configurados en Logto Console
- [ ] Credenciales copiadas a `.env.local`
- [ ] Servidor de desarrollo ejecutándose (`npm run dev`)
- [ ] Home page carga correctamente
- [ ] Login funciona y redirige a dashboard
- [ ] Dashboard muestra información del usuario
- [ ] Navegación del sidebar funciona
- [ ] Formulario de perfil laboral funciona
- [ ] Logs de Server Actions visibles en consola del servidor
- [ ] Logout funciona correctamente

---

## 🎉 ¡Listo!

Si completaste todos los pasos del checklist, tu aplicación está configurada y funcionando.

**Próximo paso:** Continuar con la implementación de los pasos restantes del funnel usando `FunnelLaborProfile.tsx` como template.

Para cualquier problema, consulta la sección de Troubleshooting o revisa los logs del servidor.
