# Manual de usuario EA3 — DSY1104

## Equipo de Reclutamiento y Selección de AquaChile

Este manual describe una demostración de la plataforma con datos ficticios. Antes de la sesión, el administrador debe iniciar backend y frontend, configurar las cuentas semilla locales y confirmar que las ofertas de demostración están publicadas. Use solo CV ficticios creados para la prueba; no cargue antecedentes reales en la demostración.

### Credenciales ficticias de demostración

Las cuentas corresponden a los correos semilla del proyecto. Las contraseñas no vienen definidas ni se comparten en el repositorio: el responsable de la demo debe configurar `EVALUADOR_PASSWORD` y `ANALISTA_PASSWORD` en `backend/.env` antes del primer inicio. Para una sesión controlada, puede asignar contraseñas ficticias, por ejemplo:

| Rol | Usuario | Contraseña de ejemplo para entorno local |
|---|---|---|
| Evaluador / psicólogo | `evaluador@aquachile.cl` | `Demo-Evaluador-2026!` |
| Analista de reclutamiento | `analista@aquachile.cl` | `Demo-Analista-2026!` |

Estos valores son propuestas de demostración, no credenciales activas del repositorio. No usarlos en producción. Si las cuentas ya fueron creadas, cambiar contraseñas requiere el procedimiento administrativo definido para el entorno.

## 1. Portal público de ofertas

1. Abra la aplicación y entre a **Ofertas** desde la navegación pública.
2. Escriba cargo o palabras clave en el buscador. Use los filtros de categoría y modalidad; la lista se actualiza con los criterios seleccionados.
3. Abra una oferta para revisar cargo, categoría, ubicación, modalidad, fecha, cupos, descripción, funciones, requisitos, beneficios y sueldo.
4. Seleccione **Postular** para iniciar el formulario con el cargo de la oferta precargado.

`[CAPTURA: listado público de ofertas con búsqueda y filtros aplicados]`

`[CAPTURA: detalle completo de oferta y botón Postular]`

## 2. Formulario y CV ficticio

1. Complete nombre, RUT, correo, teléfono, familia y cargo, experiencia, formación y disponibilidad.
2. Acepte la política de privacidad y adjunte un archivo de prueba PDF, DOC o DOCX dentro del límite configurado. Use un archivo ficticio.
3. Envíe el formulario. Revise los errores en pantalla si falta información o un dato no cumple el formato.
4. Al registrar la postulación, anote el folio de demostración. La consulta pública de seguimiento solicita folio y RUT.

`[CAPTURA: formulario completo con cargo precargado y CV ficticio seleccionado]`

`[CAPTURA: confirmación de postulación y folio ficticio]`

## 3. Acceso interno y cierre de sesión

1. Abra **Acceso evaluadores** e ingrese el correo/contraseña de prueba del rol configurado.
2. La API valida las credenciales y entrega un JWT; la interfaz conserva la sesión y carga el perfil.
3. Para comprobar autorización, ingrese al panel y luego use **Cerrar sesión** desde la navegación interna. La aplicación elimina la sesión local y vuelve a solicitar autenticación para rutas protegidas.
4. El rol analista puede revisar y exportar información, pero no editar ni evaluar. El evaluador/psicólogo sí puede realizar esas acciones.

`[CAPTURA: formulario de login con datos ficticios ocultando la contraseña]`

`[CAPTURA: panel autenticado y opción Cerrar sesión]`

## 4. Gestión de ofertas

1. Ingrese como evaluador y abra la sección **Gestión de Ofertas**.
2. Seleccione **Nueva oferta**, complete cargo, categoría, ubicación, modalidad, fecha, cupos y descripción. Funciones y requisitos son requeridos; beneficios y sueldo pueden informarse según disponibilidad.
3. Guarde para crear la oferta en borrador. Use **Editar** para modificar sus datos.
4. Seleccione **Publicar** para mostrarla en el portal público; use **Despublicar** para volver a borrador. La opción de estado también permite cerrar una oferta desde la API.

`[CAPTURA: sección de gestión con ofertas publicadas y en borrador]`

`[CAPTURA: formulario de oferta nueva o edición]`

## 5. Dashboard, evaluación y asistencia IA

1. En el Dashboard, busque o filtre candidatos y abra la ficha de evaluación. El listado muestra el estado del proceso y permite consultar historial.
2. Use **Ver CV** para descargar el documento de forma autenticada. Si no hay CV o el archivo ya no está disponible, se informa el error.
3. Complete las respuestas del cuestionario psicolaboral y registre observaciones. El sistema valida que todas las preguntas estén contestadas antes de guardar.
4. Los estados válidos son **Pendiente**, **En Proceso**, **Aprobado** y **Rechazado**. **Aprobado** o **Rechazado** representan cierre del proceso; “Finalizada” no es un estado literal implementado.
5. **Generar asistencia** analiza coincidencias textuales de cargo/familia y CV si se puede leer. Revise los criterios y las limitaciones y trate el borrador como insumo. La revisión profesional es obligatoria; el sistema no descarta candidatos automáticamente.

`[CAPTURA: Dashboard con búsqueda, filtros y estados de candidatos ficticios]`

`[CAPTURA: ficha de evaluación con botón de descarga privada del CV]`

`[CAPTURA: cuestionario, resultado y control de estado del proceso]`

`[CAPTURA: apoyo IA con criterios, limitaciones y aviso de revisión humana obligatoria]`

## Cierre de la demostración

Finalice la sesión con **Cerrar sesión**. Mantenga los datos de la demo ficticios y elimine la base y los archivos locales de prueba cuando ya no sean necesarios, de acuerdo con el procedimiento del equipo responsable.
