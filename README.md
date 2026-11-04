# Sistema de Evaluación Psicolaboral - AquaChile

## Equipo de Desarrollo
* **Vicente Krausse / David Soto**
  * **Vicente Krausse**: Desarrollo del frontend, componentes React, validaciones, estilos, experiencia de usuario y pruebas con Vitest.
  * **David Soto**: Desarrollo del backend, API REST, persistencia SQLite/PostgreSQL, autenticación y seguridad.

## Descripción del Proyecto
Plataforma web corporativa diseñada para la gestión integral, seguimiento y análisis de las evaluaciones psicolaborales de los candidatos en los procesos de selección de AquaChile.

El sistema centraliza la información de los postulantes y digitaliza el proceso de evaluación psicológica. Permite a los reclutadores y psicólogos del área de Recursos Humanos administrar perfiles, registrar resultados de pruebas y generar informes estructurados para la toma de decisiones.

El MVP se compone de una zona pública para postulantes y una zona privada para el equipo interno, con roles diferenciados para Analista y Evaluador/Psicólogo.

## Tecnologías Utilizadas
* **Frontend**: React 18, Vite 5, React Router 6, Bootstrap 5 y Bootstrap Icons.
* **Backend**: Node.js 24, Express, JWT, bcryptjs, Multer y Nodemailer.
* **Base de datos**: SQLite local con `node:sqlite` o PostgreSQL/Supabase mediante `DATABASE_URL`.
* **Pruebas**: `node:test` en backend y Vitest + Testing Library + jsdom en frontend.

## Estructura del Repositorio
* `/frontend`: Contiene el código fuente de la aplicación cliente, componentes React, vistas, contextos y pruebas Vitest.
* `/backend`: Contiene la lógica del servidor, API REST, servicios, validadores y configuración de base de datos.
* `/docs`: Contiene el ERS y la documentación de apoyo del proyecto.
* `/scripts`: Contiene el script de verificación del entorno.
* `SETUP.md`: Guía detallada de instalación, variables de entorno y solución de problemas.
* `.gitignore`: Configuración de exclusión de archivos temporales, dependencias, variables de entorno y cargas.

## Módulos Principales
* **Autenticación y Autorización**: Acceso seguro para reclutadores y psicólogos evaluadores mediante JWT y roles.
* **Dashboard de Gestión**: Panel de control con métricas de candidatos, postulaciones, evaluaciones completadas y aprobados.
* **Gestión de Candidatos**: Tabla centralizada con búsqueda, filtros, orden, paginación y estado del proceso.
* **Postulación Pública**: Formulario validado con carga de CV, generación de folio y aceptación de privacidad.
* **Consulta Pública**: Seguimiento del estado de la postulación mediante folio y RUT, sin exponer datos sensibles.
* **Evaluación Psicolaboral**: Cuestionario de 10 preguntas en 4 dimensiones, cálculo de puntaje e idoneidad.
* **Apoyo Automático**: Análisis de afinidad entre el CV y el cargo postulado.
* **Historial de Etapas**: Registro de cambios de estado y responsables del proceso.
* **Generación de Informes**: Exportación CSV y ficha individual en PDF.
* **Notificaciones por Correo**: Confirmación de postulación y aviso de aprobación cuando SMTP está configurado.

## Requisitos Previos
Para la ejecución del proyecto en un entorno local se requiere:

* Node.js 24 o superior. El backend utiliza el módulo nativo `node:sqlite`.
* npm, incluido con Node.js.
* Git.

## Instrucciones de Instalación y Ejecución Local
1. Clonar el repositorio y acceder al directorio raíz del proyecto:
   ```bash
   git clone https://github.com/D1smos/Aquachile-EV-Psicolaboral.git
   cd Aquachile-EV-Psicolaboral
   ```

2. Instalar las dependencias de backend y frontend:
   ```bash
   npm run setup
   ```

3. Crear los archivos de entorno:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   En Windows PowerShell:
   ```powershell
   copy backend\.env.example backend\.env
   copy frontend\.env.example frontend\.env
   ```

4. Completar en `backend/.env` las variables obligatorias:
   ```env
   JWT_SECRET=una_clave_larga_y_segura
   EVALUADOR_PASSWORD=clave_del_evaluador
   ANALISTA_PASSWORD=clave_del_analista
   SEED_DEMO=true
   ```

5. Verificar el entorno:
   ```bash
   npm run verificar
   ```

6. Iniciar backend y frontend en dos terminales:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

7. Abrir la aplicación:
   * Frontend: <http://127.0.0.1:5173>
   * API: <http://127.0.0.1:5000>

La guía completa de variables, base de datos, SMTP, modo producción y solución de problemas está en [`SETUP.md`](SETUP.md).

## Cuentas de Demostración
Las cuentas se crean en el primer arranque con los valores definidos en `backend/.env`.

| Rol | Correo | Permisos principales |
|---|---|---|
| Evaluador (`psicologo`) | `evaluador@aquachile.cl` | Crear, editar, evaluar, cambiar estado, eliminar y exportar |
| Analista | `analista@aquachile.cl` | Ver, filtrar, descargar documentos y exportar; sin edición ni evaluación |

Las contraseñas se configuran en `backend/.env` mediante `EVALUADOR_PASSWORD` y `ANALISTA_PASSWORD`. No se versionan en el repositorio.

## Scripts Disponibles
| Comando | Descripción |
|---|---|
| `npm run setup` | Instala dependencias de backend y frontend |
| `npm run dev:backend` | Inicia la API en modo desarrollo |
| `npm run dev:frontend` | Inicia Vite en modo desarrollo |
| `npm run build` | Compila el frontend para producción |
| `npm start` | Inicia el backend; puede servir el frontend con `SERVE_FRONTEND=true` |
| `npm run lint` | Ejecuta ESLint sobre el frontend |
| `npm test` | Ejecuta las pruebas de backend y frontend |
| `npm run test:coverage` | Ejecuta Vitest con cobertura del frontend |
| `npm run verificar` | Verifica Node, entornos, dependencias y puerto |
| `npm run demo:reset` | Restaura la base local con datos ficticios |

## Pruebas Automatizadas
* **Backend**: pruebas de API, autenticación, permisos, postulaciones, evaluación, correo y validadores con `node:test`.
* **Frontend**: pruebas de utilidades, validaciones y componentes con **Vitest + Testing Library + jsdom**. No se utiliza Karma ni Jasmine.
* **Cobertura**: el reporte HTML del frontend se genera en `frontend/cobertura/`.

Comandos:
```bash
npm test
npm test --prefix backend
npm test --prefix frontend
npm run test:coverage --prefix frontend
npm run test:cobertura --prefix backend
```

Actualmente la suite suma **38 pruebas de backend** y **52 pruebas de frontend**, con **90 pruebas aprobadas**. La cobertura frontend es de **57,85% de líneas**, con **95,04% en utilidades**, **91,83% en Postulación** y **57,74% en Dashboard**.

La evidencia detallada de casos, resultados y cobertura está en [`docs/Evidencia_Vitest_EP2.md`](docs/Evidencia_Vitest_EP2.md).

## Roles y Permisos
| Acción | Analista | Evaluador |
|---|---|---|
| Ver candidatos y métricas | Sí | Sí |
| Filtrar, buscar y exportar | Sí | Sí |
| Descargar CV, antecedentes e informe PDF | Sí | Sí |
| Ver historial | Sí | Sí |
| Crear o editar candidatos | No | Sí |
| Evaluar psicolaboralmente | No | Sí |
| Cambiar estado | No | Sí |
| Eliminar candidatos | No | Sí |

## Datos y Privacidad
* Los datos de demostración son ficticios.
* No se deben subir CV reales al repositorio.
* `backend/.env`, `frontend/.env`, `backend/data/` y `backend/uploads/` están excluidos por `.gitignore`.
* La consulta pública solo devuelve información mínima del proceso.
* El apoyo automático es una ayuda para el evaluador y no reemplaza su revisión profesional.

## Documentación
* [`SETUP.md`](SETUP.md): instalación, entornos, base de datos y solución de problemas.
* [`docs/ERS_EP2.md`](docs/ERS_EP2.md): especificación de requisitos de la EP2.
* [`docs/Evidencia_Vitest_EP2.md`](docs/Evidencia_Vitest_EP2.md): casos, resultados y cobertura.

## Estado del Proyecto
La EP2 entrega el frontend React integrado con backend, autenticación, persistencia dual y pruebas automatizadas. Quedan para la etapa final:

* Despliegue público en producción.
* Migración de archivos a Supabase Storage.
* Ampliación de pruebas sobre modales y pantallas secundarias.
* Mejoras de accesibilidad y observabilidad.
