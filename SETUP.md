# Puesta en marcha

Guía para dejar el proyecto corriendo en un PC distinto al de desarrollo.

## Requisitos

- Git
- Node.js 24 o superior (el backend usa el módulo `node:sqlite`, disponible sin flags desde Node 23.4; el proyecto se probó con Node 24)
- npm (viene incluido con Node)

Verificar antes de empezar:

```bash
node -v
npm -v
```

## 1. Clonar el repositorio

```bash
git clone https://github.com/D1smos/Aquachile-EV-Psicolaboral.git
cd Aquachile-EV-Psicolaboral
```

## 2. Instalar dependencias

Desde la raíz del proyecto:

```bash
npm run setup
```

Equivale a `npm install` dentro de `backend/` y `frontend/`. Ejecutar `npm install` solo en la raíz no instala nada, porque la raíz no tiene dependencias propias.

## 3. Configurar el backend

```bash
cp backend/.env.example backend/.env
```

En Windows PowerShell:

```powershell
copy backend\.env.example backend\.env
```

Editar `backend/.env` y completar:

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `JWT_SECRET` | Sí | Si falta o está vacía, el backend no arranca |
| `EVALUADOR_PASSWORD` | Sí | Contraseña de la cuenta evaluadora |
| `ANALISTA_PASSWORD` | Sí | Contraseña de la cuenta analista |
| `DATABASE_URL` | No | Vacía = SQLite local. Con URL = PostgreSQL/Supabase |
| `STORAGE_PROVIDER` | No | `local` (por defecto) guarda en `backend/uploads`; `supabase` usa Supabase Storage |
| `SUPABASE_URL` | Solo con `supabase` | URL del proyecto, por ejemplo `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo con `supabase` | Service Role Key; nunca la anon key ni en el frontend |
| `SUPABASE_BUCKET` | Solo con `supabase` | Bucket privado, por defecto `aquachile-documentos` |
| `STORAGE_SIGNED_URL_TTL` | No | Segundos de validez de las URLs firmadas (60 por defecto) |
| `SEED_DEMO` | No | `true` carga 10 candidatos de ejemplo en una base vacía |
| `SMTP_HOST` | No | Servidor SMTP para el correo automático de aprobación |
| `SMTP_PORT` | No | Puerto SMTP (587 por defecto) |
| `SMTP_SECURE` | No | `true` para conexión TLS directa (puerto 465) |
| `SMTP_USER` / `SMTP_PASS` | No | Credenciales SMTP, si el proveedor las exige |
| `SMTP_FROM` | No | Remitente visible, por ejemplo `Reclutamiento AquaChile <reclutamiento@aquachile.cl>` |
| `SMTP_REPLY_TO` | No | Dirección de respuesta opcional |

Si `EVALUADOR_PASSWORD` o `ANALISTA_PASSWORD` quedan vacías, las cuentas no se crean y el login responde 401.

El correo de aceptación se envía solo cuando un candidato pasa a **Aprobado** (cambio manual o al guardar la evaluación). Si `SMTP_HOST` queda vacío, el cambio de estado se guarda igual y la interfaz avisa que el correo no se envió.

Generar el secreto JWT:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 4. Configurar el frontend

```bash
cp frontend/.env.example frontend/.env
```

Sin este archivo Vite no tiene proxy hacia la API: la interfaz carga, pero todas las llamadas a `/api` responden 404.

## 5. Base de datos

### Opción A: SQLite local (por defecto)

Dejar `DATABASE_URL=` vacía. Al arrancar se crea `backend/data/aquachile.db` con las tablas y las cuentas definidas en el `.env`.

### Opción B: PostgreSQL (Supabase)

Completar `DATABASE_URL` con la cadena de conexión del pooler:

```env
DATABASE_URL=postgresql://usuario:clave@host:6543/postgres
```

- Sin comillas y sin espacios.
- Usar el puerto del pooler (6543), no el directo (5432).
- El esquema debe existir: pegar `backend/schema.sql` en el SQL Editor de Supabase.
- Pedir la cadena por un canal privado: no se versiona.

### Almacenamiento de documentos

Los CV y antecedentes se guardan con un adaptador intercambiable:

- **Local (por defecto)**: `STORAGE_PROVIDER=local` escribe en `backend/uploads`, igual que antes. No requiere configuración adicional.
- **Supabase Storage**: `STORAGE_PROVIDER=supabase` usa un bucket privado y entrega URLs firmadas de corta duración. Requiere `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_BUCKET`.

Para habilitar Supabase Storage:

1. Crear el bucket privado (por ejemplo `aquachile-documentos`) en el panel de Supabase.
2. Completar las variables en `backend/.env` (nunca en el frontend ni en el repositorio).
3. Migrar los archivos existentes desde `backend/uploads`:

```bash
cd backend
npm run migrar:storage
```

El script calcula el hash SHA-256, sube los binarios, actualiza `storageKey`, `proveedor`, `bucket` y `hash`, y marca con `deletedAt` los registros cuyo archivo ya no existe en disco. Es idempotente: los registros ya migrados se omiten.

La deduplicación usa el hash: si dos candidatos adjuntan el mismo archivo, se guarda una sola copia y solo se elimina del almacenamiento cuando no quedan referencias activas.

### Datos de ejemplo

Con una base vacía y `SEED_DEMO=true`, el primer arranque inserta 10 candidatos de demostración. Los datos reales del proyecto no están en GitHub: la carpeta `backend/data/` está ignorada por Git.

## 6. Ejecutar

Dos terminales desde la raíz:

```bash
npm run dev:backend
npm run dev:frontend
```

- API: <http://127.0.0.1:5000>
- Interfaz: <http://127.0.0.1:5173>

Modo producción con el backend sirviendo el frontend compilado:

```bash
npm run build
# en backend/.env: SERVE_FRONTEND=true
npm start
```

## 7. Cuentas de acceso

Se crean en el primer arranque con los valores del `.env`:

| Rol | Correo por defecto | Permisos |
| --- | --- | --- |
| Evaluador (`psicologo`) | `evaluador@aquachile.cl` | Ver, evaluar, usar el asistente IA y exportar |
| Analista | `analista@aquachile.cl` | Ver y exportar; no puede evaluar (403) |

## 8. Verificar el entorno

```bash
npm run verificar
```

Revisa la versión de Node, los archivos `.env`, las variables obligatorias, las dependencias instaladas, el motor de base de datos y el puerto. Termina con código 1 si hay algo bloqueante.

## 9. Solución de problemas

| Mensaje o síntoma | Causa | Solución |
| --- | --- | --- |
| `Falta la variable de entorno obligatoria "JWT_SECRET"` | No existe `backend/.env` o `JWT_SECRET` está vacía | Crear el archivo y completar la variable |
| `Cannot find module 'node:sqlite'` | Node demasiado antiguo | Instalar Node 24 o superior |
| `EADDRINUSE: address already in use :::5000` | Puerto ocupado por otro proceso | Cerrar ese proceso o cambiar `PORT` |
| Login responde 401 con credenciales correctas | `EVALUADOR_PASSWORD` / `ANALISTA_PASSWORD` vacías: las cuentas nunca se crearon | Completarlas y reiniciar; si la base ya existía, borrar `backend/data/aquachile.db` y volver a arrancar |
| La interfaz carga pero todo `/api` responde 404 | Falta `frontend/.env` (no hay proxy) | Copiar `frontend/.env.example` |
| `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `password authentication failed` | `DATABASE_URL` incorrecta, puerto directo bloqueado o sin red | Revisar la cadena, usar el pooler 6543 y probar desde otra red |
| `ERR_MODULE_NOT_FOUND` (`express`, `vite`, etc.) | Dependencias no instaladas | `npm run setup` |
| Dashboard sin datos | Base recién creada y `SEED_DEMO=false` | Activar `SEED_DEMO=true` o configurar `DATABASE_URL` |
| `SQLITE_CANTOPEN` | Sin permisos en `backend/data/` | Revisar los permisos de la carpeta |

## 10. Seguridad

- Nunca subir `backend/.env` ni `frontend/.env`; ya están en `.gitignore`.
- Las credenciales y la cadena de Supabase se comparten por un canal privado.
- `JWT_SECRET` debe ser distinto en cada entorno.
