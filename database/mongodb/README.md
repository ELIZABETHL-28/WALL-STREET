# Base de Datos No Relacional

## HOTEL WALL STREET — MongoDB

---

## 1. Objetivo

MongoDB se utilizará como base de datos no relacional del sistema HOTEL WALL STREET para almacenar información dinámica, documental y de estructura variable que no se adapta de forma natural al modelo relacional de MySQL.

Su propósito principal es gestionar la información del foro de interacción, los comentarios y calificaciones de los clientes, los reportes de contenido y los registros de auditoría del sistema.

---

## 2. Herramienta de administración

Durante el desarrollo se utilizará **MongoDB Compass** para visualizar, explorar y administrar la información almacenada en las colecciones de forma gráfica.

MongoDB Compass permite inspeccionar documentos, ejecutar consultas, revisar índices y validar la estructura de la información sin necesidad de utilizar comandos en la terminal.

---

## 3. Nombre de la base de datos

```text
hotel_wall_street_nosql
```

---

## 4. Colecciones previstas

### 4.1. `foro_publicaciones`

Almacena las publicaciones realizadas por los clientes en el foro de interacción del hotel.

Cada documento representa una publicación e incluirá información como el identificador del usuario autor, el título, el contenido del mensaje, la fecha de publicación y un arreglo de respuestas asociadas a esa publicación.

Esta colección permite manejar respuestas anidadas de forma flexible, ya que la cantidad y estructura de las respuestas puede variar entre publicaciones.

**Ejemplo de documento:**

```json
{
  "usuarioId": 15,
  "titulo": "¿Qué actividad recomiendan?",
  "contenido": "Visitaré el hotel durante tres días y me gustaría aprovechar al máximo.",
  "fechaPublicacion": "2026-07-01T10:00:00Z",
  "estado": "activo",
  "respuestas": [
    {
      "usuarioId": 20,
      "contenido": "Te recomiendo la actividad nocturna del miércoles.",
      "fecha": "2026-07-01T11:30:00Z"
    }
  ]
}
```

---

### 4.2. `comentarios_hotel`

Almacena los comentarios y calificaciones publicados por los clientes sobre su experiencia en el hotel.

Cada documento incluirá el identificador del usuario, el contenido del comentario, la fecha y las calificaciones asociadas a aspectos como limpieza, servicio, habitaciones y actividades.

La estructura de calificaciones puede variar según los criterios que el cliente decida evaluar, lo que hace que un esquema flexible sea más conveniente que una tabla fija.

**Ejemplo de documento:**

```json
{
  "usuarioId": 8,
  "comentario": "Excelente servicio y habitaciones muy cómodas.",
  "fecha": "2026-06-28T09:15:00Z",
  "calificaciones": {
    "limpieza": 5,
    "servicio": 5,
    "habitaciones": 4,
    "actividades": 5
  },
  "estado": "publicado"
}
```

---

### 4.3. `reportes_foro`

Almacena los reportes generados por los usuarios cuando identifican publicaciones con contenido inapropiado dentro del foro.

Cada documento registrará el identificador del usuario que realizó el reporte, la referencia a la publicación reportada, el motivo del reporte y la fecha en que fue enviado.

Esta colección permite que los administradores revisen y moderen el contenido reportado del foro.

**Ejemplo de documento:**

```json
{
  "usuarioId": 12,
  "publicacionId": "64f2c3e8a1b2c3d4e5f60001",
  "motivo": "Contenido ofensivo",
  "fecha": "2026-07-02T14:45:00Z",
  "estado": "pendiente"
}
```

---

### 4.4. `auditoria`

Almacena registros de las acciones importantes realizadas dentro del sistema.

Cada documento representará un evento registrado e incluirá el tipo de acción, el usuario que la realizó, la fecha, el módulo del sistema involucrado y detalles adicionales relevantes.

Esta colección permite conocer el historial de operaciones del sistema para fines de seguimiento, revisión y control.

**Ejemplo de documento:**

```json
{
  "accion": "RESERVACION_CREADA",
  "usuarioId": 5,
  "modulo": "reservaciones",
  "fecha": "2026-07-03T08:20:00Z",
  "detalle": {
    "reservacionId": 101,
    "habitacionId": 204,
    "fechaEntrada": "2026-07-10",
    "fechaSalida": "2026-07-13"
  }
}
```

---

## 5. Por qué MongoDB y no MySQL para esta información

MySQL es la base de datos principal del sistema y gestiona toda la información estructurada y relacional del hotel, como habitaciones, reservaciones, clientes, empleados, servicios y cupones. Esa información tiene una estructura bien definida, utiliza claves primarias y claves foráneas, y requiere consistencia relacional.

MongoDB se utiliza para información que tiene características distintas:

- **Estructura variable:** Un comentario puede incluir distintas calificaciones según lo que el cliente decida evaluar. Una publicación del foro puede tener cero respuestas o muchas, con distintos campos internos.
- **Documentos anidados:** Las respuestas dentro de una publicación del foro se representan de forma natural como un arreglo dentro del mismo documento, sin necesidad de tablas adicionales ni relaciones complejas.
- **Registros dinámicos de auditoría:** Cada evento del sistema puede tener detalles distintos según la acción registrada. Un esquema flexible permite almacenar esta información sin reestructurar tablas.
- **Escalabilidad documental:** El volumen de publicaciones, comentarios y registros de auditoría puede crecer de forma considerable con el tiempo. MongoDB está diseñado para manejar grandes volúmenes de documentos de forma eficiente.

Separar este tipo de información en MongoDB permite que MySQL se mantenga limpio, organizado y orientado exclusivamente a los procesos relacionales del negocio.

---

## 6. Conexión desde el backend

La conexión a MongoDB será realizada únicamente desde el backend del sistema mediante Node.js.

La cadena de conexión se configurará utilizando la variable de entorno `MONGODB_URI` definida en el archivo `.env`.

La implementación de la conexión se realizará en una etapa posterior del desarrollo.

---

## 7. Acceso desde el frontend

El frontend no se conectará directamente a MongoDB.

Toda la información almacenada en MongoDB será accedida exclusivamente a través de los endpoints del backend.

El frontend únicamente consumirá la API proporcionada por el backend para obtener o enviar información.
