# REQUERIMIENTOS FUNCIONALES

## Proyecto: HOTEL WALL STREET

### Sistema Web Integral de Gestión Hotelera

El sistema HOTEL WALL STREET tendrá como objetivo facilitar la administración de un hotel de gran capacidad mediante una plataforma web moderna que permita gestionar habitaciones, clientes, empleados, reservaciones, pases diarios, servicios adicionales, actividades, cupones de descuento y control de acceso mediante códigos QR.

La plataforma contará con dos roles principales: administrador y cliente.

## RF-01. Autenticación de usuarios

El sistema deberá permitir el registro e inicio de sesión de clientes.

El sistema deberá permitir iniciar sesión mediante una cuenta de Google utilizando Supabase Auth.

El sistema deberá identificar la sesión activa del usuario.

El sistema deberá permitir cerrar sesión de manera segura.

## RF-02. Gestión de roles

El sistema deberá manejar los roles ADMIN y CLIENTE.

El administrador tendrá acceso al panel administrativo.

Los clientes únicamente podrán acceder a las funciones destinadas a usuarios registrados.

El sistema deberá restringir el acceso a funciones administrativas según el rol del usuario.

## RF-03. Gestión de clientes

El sistema deberá permitir registrar clientes.

El cliente podrá consultar y actualizar su información personal.

El administrador podrá consultar los clientes registrados.

Cada cliente podrá consultar sus reservaciones, pases diarios y códigos QR.

## RF-04. Gestión de empleados

El administrador podrá registrar empleados.

El administrador podrá modificar la información de los empleados.

El administrador podrá cambiar el estado de un empleado.

El sistema deberá almacenar el puesto y la información básica del empleado.

## RF-05. Gestión de habitaciones

El administrador podrá registrar habitaciones.

El administrador podrá modificar la información de una habitación.

El sistema deberá almacenar el número de habitación, tipo, capacidad máxima de visitantes, cantidad de camas, tipo de camas, descripción y precio por noche.

Cada habitación deberá tener un estado.

Los estados disponibles serán DISPONIBLE, RESERVADA, OCUPADA, LIMPIEZA y MANTENIMIENTO.

El sistema deberá mostrar fotografías de las habitaciones.

## RF-06. Disponibilidad de habitaciones

El sistema deberá consultar las habitaciones disponibles según un rango de fechas.

El sistema deberá evitar la asignación de una habitación que tenga una reservación activa durante las fechas seleccionadas.

El sistema deberá considerar la cantidad de visitantes y camas solicitadas.

## RF-07. Asignación automática de habitaciones

El sistema deberá permitir la asignación automática de habitaciones.

El sistema deberá buscar habitaciones disponibles.

El sistema deberá comparar la capacidad máxima de visitantes y la cantidad de camas requeridas.

El sistema deberá seleccionar la habitación disponible que mejor se adapte a las necesidades del cliente.

## RF-08. Gestión de reservaciones

Los clientes registrados podrán realizar reservaciones.

El cliente deberá indicar fecha de entrada, fecha de salida y cantidad de visitantes.

El sistema deberá verificar la disponibilidad antes de confirmar una reservación.

Cada reservación deberá tener un código único.

El cliente podrá consultar sus reservaciones.

El administrador podrá consultar todas las reservaciones.

## RF-09. Gestión de servicios adicionales

El administrador podrá registrar servicios adicionales.

Cada servicio deberá contener nombre, descripción, precio y estado.

Los clientes podrán consultar los servicios disponibles.

Los servicios podrán ser asociados a una reservación.

## RF-10. Gestión de actividades

El administrador podrá crear actividades.

Cada actividad deberá almacenar nombre, descripción, fecha, hora, ubicación, precio y cantidad máxima de participantes.

Los clientes podrán consultar las actividades disponibles.

Los clientes registrados podrán inscribirse en actividades.

El sistema deberá controlar la cantidad de cupos disponibles.

## RF-11. Gestión de pases diarios

El administrador podrá crear diferentes tipos de pases diarios.

Cada pase deberá incluir nombre, descripción, precio, cantidad máxima de personas y servicios incluidos.

Los clientes podrán adquirir un pase diario sin necesidad de reservar una habitación.

Cada pase adquirido deberá tener un código único.

El sistema deberá controlar el estado del pase.

Los estados disponibles serán ACTIVO, UTILIZADO, VENCIDO y CANCELADO.

## RF-12. Generación de cupones

El administrador podrá generar cupones de descuento.

El sistema deberá generar automáticamente un código de cupón aleatorio y único.

El administrador podrá definir el porcentaje o cantidad de descuento.

El administrador podrá establecer una fecha de inicio y fecha de vencimiento.

El administrador podrá establecer un límite de usos.

El sistema deberá validar el cupón antes de aplicar un descuento.

## RF-13. Generación de códigos QR

El sistema deberá generar un código QR para cada reservación confirmada.

El sistema deberá generar un código QR para cada pase diario adquirido.

El código QR deberá contener únicamente un identificador único.

Al consultar el identificador, el sistema deberá determinar si corresponde a una reservación o a un pase diario.

El sistema deberá mostrar el estado del pase o reservación.

## RF-14. Comentarios y calificaciones

Los clientes registrados podrán publicar comentarios sobre su experiencia.

Los clientes podrán asignar una calificación al hotel.

El sistema deberá permitir calificaciones relacionadas con limpieza, servicio, habitaciones y actividades.

El sistema deberá mostrar la calificación promedio del hotel.

El administrador podrá moderar comentarios.

## RF-15. Foro de interacción

Los clientes registrados podrán crear publicaciones en el foro.

Los clientes podrán responder publicaciones.

Los autores podrán editar sus publicaciones.

Los administradores podrán moderar el contenido del foro.

Los usuarios podrán reportar publicaciones inapropiadas.

## RF-16. Panel administrativo

El sistema deberá proporcionar un panel exclusivo para administradores.

El panel deberá mostrar información general del hotel.

El administrador podrá consultar la cantidad de clientes registrados.

El administrador podrá consultar habitaciones disponibles, reservadas y ocupadas.

El administrador podrá visualizar las reservaciones activas.

El administrador podrá consultar los pases diarios vendidos.

El administrador podrá gestionar habitaciones, empleados, servicios, actividades, cupones y reservaciones.

## RF-17. Página principal

El sistema deberá contar con una página principal pública.

La página principal deberá utilizar un carrusel automático de imágenes como fondo principal.

El carrusel deberá contener tres imágenes de alta resolución.

Las imágenes deberán representar la fachada corporativa del hotel, una suite presidencial ejecutiva y el Business Center o helipuerto.

Las imágenes deberán cambiar automáticamente cada cinco o seis segundos.

El cambio entre imágenes deberá utilizar una transición visual de desvanecimiento.

El carrusel deberá ocupar el ancho y alto completo de la pantalla inicial.

El sistema deberá aplicar una capa oscura semitransparente sobre las imágenes para garantizar la legibilidad del contenido.

Sobre el carrusel se mostrará una tarjeta flotante con efecto de cristal.

La tarjeta deberá presentar la identidad principal de HOTEL WALL STREET y permitir al usuario acceder al sistema.

El carrusel podrá pausar su transición cuando el usuario mantenga el cursor sobre la pantalla.


# REQUERIMIENTOS TÉCNICOS

## RT-01. Arquitectura del sistema

El proyecto deberá implementarse utilizando una arquitectura separada entre frontend y backend.

El frontend será responsable de la interfaz gráfica y la interacción con el usuario.

El backend será responsable de la lógica del negocio, validaciones, procesamiento de reservaciones y comunicación con las bases de datos.

## RT-02. Frontend

El sistema deberá ejecutarse como un sitio web responsivo.

La interfaz deberá adaptarse a computadoras, tablets y dispositivos móviles.

La página principal deberá implementar una interfaz moderna con identidad visual corporativa y ejecutiva.

El frontend consumirá la información del backend mediante una API.

## RT-03. Backend

El backend deberá desarrollarse utilizando Node.js.

El sistema deberá proporcionar endpoints para las funciones principales de la plataforma.

El backend deberá validar los datos recibidos antes de procesarlos.

La lógica de reservaciones, disponibilidad, asignación automática, cupones y códigos QR deberá procesarse en el backend.

## RT-04. Base de datos relacional

El sistema utilizará MySQL como base de datos relacional.

La administración y diseño de la base de datos se realizará mediante MySQL Workbench.

MySQL almacenará la información estructurada y relacionada correspondiente a clientes, habitaciones, reservaciones, empleados, servicios, actividades, pases diarios y cupones.

Las tablas deberán utilizar claves primarias y claves foráneas para mantener las relaciones e integridad de la información.

## RT-05. Base de datos no relacional

El sistema utilizará MongoDB como base de datos no relacional.

La base de datos será administrada mediante MongoDB Compass.

MongoDB almacenará información dinámica relacionada con el foro, comentarios, calificaciones y registros de actividad.

## RT-06. Autenticación

El sistema utilizará Supabase Auth para la autenticación de usuarios.

La plataforma deberá permitir autenticación mediante Google.

El sistema utilizará la sesión autenticada para identificar al usuario conectado.

## RT-07. Control de acceso

El sistema implementará los roles ADMIN y CLIENTE.

Las rutas y funciones administrativas deberán estar protegidas.

El backend deberá comprobar los permisos del usuario antes de ejecutar operaciones restringidas.

## RT-08. Seguridad

Los datos recibidos mediante la API deberán ser validados.

El sistema deberá proteger las rutas privadas.

Las credenciales y claves de servicios externos deberán almacenarse utilizando variables de entorno.

El sistema no deberá almacenar información sensible directamente dentro de códigos QR.

## RT-09. Generación de códigos QR

Los códigos QR deberán generarse mediante una librería compatible con Node.js.

El QR almacenará un identificador único relacionado con una reservación o pase diario.

La información asociada al código deberá consultarse desde el backend.

## RT-10. Despliegue

El proyecto deberá estar preparado para despliegue web mediante Vercel.

Las configuraciones sensibles deberán administrarse mediante variables de entorno.

El proyecto deberá separar las configuraciones utilizadas durante el desarrollo y el entorno desplegado.

## RT-11. Bases de datos

La conexión con MySQL y MongoDB deberá realizarse desde el backend.

El frontend no deberá conectarse directamente a las bases de datos principales del sistema.

## RT-12. Organización del código

El código deberá organizarse mediante carpetas separadas para rutas, controladores, modelos, servicios, middlewares y configuraciones.

El sistema deberá mantener una separación clara de responsabilidades entre los diferentes módulos.

## RT-13. Compatibilidad

La aplicación deberá ser funcional en navegadores web modernos.

La interfaz deberá diseñarse principalmente para Google Chrome y navegadores basados en Chromium.
