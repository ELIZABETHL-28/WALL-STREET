# HOTEL WALL STREET

## Sistema Web Integral de Gestión Hotelera

HOTEL WALL STREET es una plataforma web orientada a la administración y operación de un hotel de gran capacidad.

El sistema permite gestionar habitaciones, clientes, empleados, reservaciones, servicios adicionales, actividades, pases diarios, cupones de descuento y códigos QR de acceso.

La plataforma cuenta con los roles ADMIN y CLIENTE e implementa autenticación mediante Supabase y Google.

## Tecnologías

### Frontend

Interfaz web responsiva para clientes y administradores.

### Backend

Node.js para la implementación de la API y la lógica del negocio.

### Base de datos relacional

MySQL.

Administrada mediante MySQL Workbench.

### Base de datos no relacional

MongoDB.

Administrada mediante MongoDB Compass.

### Autenticación

Supabase Auth y Google OAuth.

### Despliegue

Vercel.

## Estructura del proyecto

```text
hotel-wall-street/
│
├── frontend/
├── backend/
├── database/
│   ├── mysql/
│   └── mongodb/
├── docs/
├── README.md
└── .gitignore
```

## Instalación

### 1. Clonar o descargar el proyecto

Obtener una copia local del proyecto.

### 2. Configurar MySQL

Ingresar al directorio:

```text
database/mysql/
```

Ejecutar los archivos en el siguiente orden:

```text
schema.sql
seed.sql
```

Para más información consultar:

```text
database/mysql/README.md
```

### 3. Configurar MongoDB

Consultar las instrucciones ubicadas en:

```text
database/mongodb/README.md
```

### 4. Configurar variables de entorno

Crear los archivos de variables de entorno necesarios utilizando los archivos `.env.example` proporcionados en el proyecto.

### 5. Instalar dependencias

Instalar las dependencias correspondientes al frontend y backend.

### 6. Ejecutar el proyecto

Iniciar el backend y posteriormente el frontend.

## Roles del sistema

### ADMIN

Permite administrar habitaciones, empleados, reservaciones, servicios, actividades, pases diarios y cupones.

### CLIENTE

Permite consultar habitaciones, realizar reservaciones, adquirir pases, utilizar cupones, visualizar códigos QR y participar en el foro.

## Estado del proyecto

Proyecto académico en desarrollo.
