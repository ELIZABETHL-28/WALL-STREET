# Base de Datos MySQL — HOTEL WALL STREET

Este directorio contiene los archivos necesarios para crear y poblar la base de datos relacional del Sistema Web Integral de Gestión Hotelera HOTEL WALL STREET.

---

## Requisitos

- MySQL Server 8.0 o superior.
- MySQL Workbench.

---

## Archivos

### schema.sql

Define la estructura completa de la base de datos `hotel_wall_street`.

Incluye todas las tablas, claves primarias, claves foráneas y restricciones de integridad (CHECK, UNIQUE).

### seed.sql

Contiene los datos iniciales necesarios para ejecutar y probar el sistema durante el desarrollo.

---

## Orden de ejecución

Los archivos deben ejecutarse en el siguiente orden:

1. `schema.sql`
2. `seed.sql`

No ejecutar `seed.sql` antes de `schema.sql`, ya que las tablas requeridas todavía no existirán.

---

## Instalación mediante MySQL Workbench

1. Abrir MySQL Workbench y conectarse al servidor MySQL local.
2. Abrir el archivo `schema.sql` y ejecutar el script completo.
3. Abrir el archivo `seed.sql` y ejecutar el script completo.
4. Actualizar la sección Schemas del panel izquierdo.

Al finalizar deberá aparecer la base de datos `hotel_wall_street` con todas sus tablas.

---

## Módulos del modelo relacional

El modelo relacional está organizado en los siguientes módulos:

### Usuarios

Gestiona los roles del sistema, los usuarios autenticados mediante Supabase, los clientes registrados y los empleados del hotel.

Tablas: `roles`, `usuarios`, `clientes`, `empleados`.

### Habitaciones

Almacena los tipos de habitaciones, las habitaciones disponibles, la composición de camas por habitación y las imágenes asociadas.

Tablas: `tipos_habitacion`, `habitaciones`, `tipos_cama`, `habitacion_camas`, `imagenes_habitacion`.

### Reservaciones

Registra las reservaciones realizadas por los clientes, las habitaciones asignadas a cada reservación y los visitantes que se hospedarán.

Tablas: `reservaciones`, `reservacion_habitaciones`, `reservacion_visitantes`.

### Servicios

Almacena los servicios adicionales del hotel y su asociación con reservaciones específicas.

Tablas: `servicios`, `reservacion_servicios`.

### Actividades

Gestiona las actividades organizadas por el hotel y las inscripciones de los clientes.

Tablas: `actividades`, `inscripciones_actividades`.

### Pases

Almacena los tipos de pases diarios disponibles y los pases adquiridos por los clientes.

Tablas: `tipos_pase`, `pases_cliente`.

### Cupones

Gestiona los cupones de descuento generados por el administrador y registra cada uso aplicado.

El código único de cada cupón será generado desde el backend en tiempo de ejecución. La tabla únicamente prepara la estructura para recibirlo.

Tablas: `cupones`, `cupones_usados`.

### Control de acceso

Almacena los identificadores únicos que el backend utilizará posteriormente para generar los códigos QR de reservaciones y pases.

Tabla: `codigos_acceso`.

---

## Disponibilidad de habitaciones

La disponibilidad no se calcula mediante una tabla independiente.

El backend determinará si una habitación está disponible consultando directamente las tablas `reservaciones` y `reservacion_habitaciones`, evaluando si existe alguna reservación en estado `CONFIRMADA` o `CHECK_IN` cuyo rango de fechas (`fecha_entrada`, `fecha_salida`) se superponga con el rango solicitado por el cliente.

Este enfoque mantiene la base de datos libre de información redundante y delega el cálculo de disponibilidad a la capa de servicios del backend.

---

## Tablas del sistema

| Módulo           | Tabla                        |
|------------------|------------------------------|
| Usuarios         | roles                        |
| Usuarios         | usuarios                     |
| Usuarios         | clientes                     |
| Usuarios         | empleados                    |
| Habitaciones     | tipos_habitacion             |
| Habitaciones     | habitaciones                 |
| Habitaciones     | tipos_cama                   |
| Habitaciones     | habitacion_camas             |
| Habitaciones     | imagenes_habitacion          |
| Reservaciones    | reservaciones                |
| Reservaciones    | reservacion_habitaciones     |
| Reservaciones    | reservacion_visitantes       |
| Servicios        | servicios                    |
| Servicios        | reservacion_servicios        |
| Actividades      | actividades                  |
| Actividades      | inscripciones_actividades    |
| Pases            | tipos_pase                   |
| Pases            | pases_cliente                |
| Cupones          | cupones                      |
| Cupones          | cupones_usados               |
| Control acceso   | codigos_acceso               |

Total: **21 tablas**.

---

## Configuración del backend

El backend deberá conectarse a MySQL utilizando variables de entorno definidas en el archivo `.env`.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD
DB_NAME=hotel_wall_street
```

Las credenciales reales no deben almacenarse directamente en el código fuente del proyecto.
