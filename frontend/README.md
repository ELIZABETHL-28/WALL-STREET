# Frontend — HOTEL WALL STREET

Interfaz web construida con React + Vite para el Sistema Web Integral de Gestión Hotelera HOTEL WALL STREET.

---

## Requisitos

- Node.js 18 o superior.
- Backend corriendo en `http://localhost:3000` (o la URL definida en `VITE_API_URL`).
- Proyecto Supabase configurado con autenticación habilitada.

---

## Instalación

```bash
cd frontend
npm install
```

---

## Variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=TU_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

El archivo `.env` está ignorado por Git.

---

## Ejecución en desarrollo

```bash
npm run dev
```

El servidor de desarrollo iniciará en `http://localhost:5173` por defecto.

---

## Build de producción

```bash
npm run build
```

---

## Rutas implementadas

| Ruta             | Descripción                                          | Protección       |
|------------------|------------------------------------------------------|------------------|
| `/`              | Redirección a `/login`                               | —                |
| `/login`         | Inicio de sesión (email/password o Google)           | —                |
| `/registro`      | Registro de nueva cuenta                             | —                |
| `/auth/callback` | Procesamiento del retorno OAuth (Google)             | —                |
| `/perfil`        | Perfil del cliente autenticado                       | CLIENTE          |
| `/admin`         | Panel temporal de validación de acceso administrativo| ADMIN            |

---

## Notas de configuración

### Google OAuth

Para que el botón "Continuar con Google" funcione:
1. Crear un proyecto en Google Cloud Console.
2. Habilitar la API de Google Identity.
3. Crear credenciales OAuth 2.0 con la URL de callback de Supabase.
4. Configurar el proveedor Google en el dashboard de Supabase.

La URL de callback de Supabase es:
```
https://TU_PROYECTO.supabase.co/auth/v1/callback
```

### Confirmación de correo

Si Supabase está configurado para requerir confirmación de correo, el usuario debe revisar su bandeja de entrada antes de poder iniciar sesión. La interfaz muestra un mensaje informativo en este caso.
