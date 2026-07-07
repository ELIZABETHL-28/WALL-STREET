# Backend — HOTEL WALL STREET

API REST construida con Node.js y Express para el Sistema Web Integral de Gestión Hotelera HOTEL WALL STREET.

---

## Función

El backend centraliza la lógica del negocio, valida las solicitudes del frontend, gestiona la comunicación con MySQL y MongoDB, y valida tokens de Supabase Auth.

El frontend no se conecta directamente a ninguna base de datos. Toda la información fluye a través de esta API.

---

## Requisitos

- Node.js 18 o superior.
- MySQL 8.0 con la base de datos `hotel_wall_street` creada (ver `database/mysql/`).
- Proyecto Supabase configurado (para autenticación).
- MongoDB accesible mediante URI de conexión válida.

---

## Instalación

```bash
cd backend
npm install
```

---

## Variables de entorno

```bash
cp .env.example .env
```

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL
DB_NAME=hotel_wall_street

MONGODB_URI=TU_URI_MONGODB

SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

---

## Ejecución

```bash
# Desarrollo con recarga automática
npm run dev

# Producción
npm start
```

---

## Endpoints implementados

### Sistema

| Método | Endpoint        | Descripción                              | Auth |
|--------|-----------------|------------------------------------------|------|
| GET    | /api/health     | Estado de la API y conexiones a BD       | No   |

### Autenticación

| Método | Endpoint        | Descripción                              | Auth          |
|--------|-----------------|------------------------------------------|---------------|
| POST   | /api/auth/sync  | Sincroniza usuario Supabase con MySQL    | Bearer Token  |
| GET    | /api/auth/me    | Devuelve el usuario del sistema          | Bearer Token  |

### Perfil de cliente

| Método | Endpoint              | Descripción                              | Auth + Rol     |
|--------|-----------------------|------------------------------------------|----------------|
| GET    | /api/clientes/perfil  | Obtiene el perfil del cliente            | CLIENTE        |
| POST   | /api/clientes/perfil  | Crea el perfil por primera vez           | CLIENTE        |
| PUT    | /api/clientes/perfil  | Actualiza campos permitidos del perfil   | CLIENTE        |

---

## Flujo de autenticación

1. El usuario inicia sesión en el frontend mediante Supabase.
2. El frontend obtiene el `access_token` de la sesión Supabase.
3. El frontend envía `POST /api/auth/sync` con `Authorization: Bearer TOKEN`.
4. El backend valida el token con `supabase.auth.getUser(token)`.
5. Si el usuario no existe en MySQL, se crea con rol `CLIENTE`.
6. Las rutas protegidas usan el middleware `authenticate` que valida Supabase y carga el usuario de MySQL.
7. El rol se obtiene siempre desde MySQL — nunca desde el frontend ni desde metadata.

---

## Estructura de carpetas

```text
backend/
├── src/
│   ├── config/
│   │   ├── mysql.js          Pool de conexiones MySQL
│   │   ├── mongodb.js        Conexión Mongoose
│   │   └── supabase.js       Cliente Supabase
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── auth.controller.js
│   │   └── client.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      Validación Supabase + carga usuario MySQL
│   │   ├── role.middleware.js      Control de acceso por rol
│   │   ├── error.middleware.js     Manejo centralizado de errores
│   │   └── notFound.middleware.js  Respuesta 404
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── auth.routes.js
│   │   ├── client.routes.js
│   │   └── index.js
│   ├── services/
│   │   ├── auth.service.js    Lógica de sincronización
│   │   └── client.service.js  Lógica de perfil cliente
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

---

## Primer administrador

Ver: `docs/CONFIGURACION_ADMIN.md`

No existe endpoint público para crear administradores. Todo nuevo usuario recibe el rol CLIENTE automáticamente.
