# Configuración del primer administrador

## HOTEL WALL STREET

---

## Consideraciones de seguridad

No existe un endpoint público para crear administradores.
No existe registro de ADMIN desde la interfaz de usuario.
Todo usuario que se registra o inicia sesión recibe automáticamente el rol CLIENTE.

La promoción a ADMIN se realiza manualmente desde MySQL Workbench por una persona con acceso directo a la base de datos.

---

## Procedimiento

### Paso 1 — Crear la cuenta de usuario

Registrarse normalmente en la aplicación mediante:
- Correo electrónico y contraseña, o
- Inicio de sesión con Google.

### Paso 2 — Sincronizar el usuario con MySQL

Ejecutar la siguiente solicitud con el access token de Supabase:

```http
POST /api/auth/sync
Authorization: Bearer ACCESS_TOKEN
```

Esto crea el registro en la tabla `usuarios` con rol CLIENTE.

### Paso 3 — Confirmar el registro en MySQL

Verificar que el usuario existe en la base de datos con el correo correcto:

```sql
SELECT
    u.id_usuario,
    u.correo,
    u.supabase_uid,
    r.nombre AS rol,
    u.estado
FROM usuarios u
INNER JOIN roles r ON r.id_rol = u.id_rol
WHERE u.correo = 'CORREO_ADMIN';
```

Reemplazar `CORREO_ADMIN` con el correo exacto del usuario a promover.

### Paso 4 — Promover a ADMIN

Ejecutar desde MySQL Workbench:

```sql
UPDATE usuarios
SET id_rol = (
    SELECT id_rol
    FROM roles
    WHERE nombre = 'ADMIN'
)
WHERE correo = 'CORREO_ADMIN';
```

Reemplazar `CORREO_ADMIN` con el correo exacto del usuario.

### Paso 5 — Verificar la promoción

```sql
SELECT
    u.id_usuario,
    u.correo,
    r.nombre AS rol,
    u.estado
FROM usuarios u
INNER JOIN roles r ON r.id_rol = u.id_rol
WHERE u.correo = 'CORREO_ADMIN';
```

El campo `rol` debe mostrar `ADMIN`.

---

## Notas importantes

- No utilizar esta sentencia con correos desconocidos o no verificados.
- La promoción se realiza fuera del alcance de los clientes del sistema.
- El cambio tiene efecto inmediato; la próxima solicitud autenticada obtendrá el rol ADMIN desde MySQL.
- No incluir un correo real en este documento.
- Este proceso es exclusivo para entornos controlados con acceso administrativo a la base de datos.
