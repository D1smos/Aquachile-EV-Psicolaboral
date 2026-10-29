# Sistema de Evaluación Psicolaboral - AquaChile

## Equipo de Desarrollo
* **Vicente Krausse / David Soto**
  * **D1smos**: Desarrollo del frontend, estructura inicial del proyecto, maquetación de interfaces e implementación del formulario de postulación con validaciones.
  * **mardram**: Configuración de infraestructura inicial del proyecto, gestión de archivos base y enfocado en el desarrollo e integración del backend.

## Descripción del Proyecto
Plataforma web corporativa diseñada para la gestión integral, seguimiento y análisis de las evaluaciones psicolaborales de los candidatos en los procesos de selección de AquaChile.

El sistema centraliza la información de los postulantes y digitaliza el proceso de evaluación psicológica. Permite a los reclutadores y psicólogos del área de Recursos Humanos administrar perfiles, registrar resultados de pruebas y generar informes estructurados para la toma de decisiones.

## Estructura del Repositorio
* `/frontend`: Contiene el código fuente de la aplicación cliente (interfaz de usuario).
* `/backend`: Contiene la lógica del servidor, modelos de datos y API REST (Node.js/Express).
* `.gitignore`: Configuración de exclusión de archivos temporales, dependencias y variables de entorno.
* `README.md`: Documentación técnica principal del proyecto.

## Módulos Principales (En Desarrollo)
* **Autenticación y Autorización**: Acceso seguro para reclutadores y psicólogos evaluadores.
* **Dashboard de Gestión**: Panel de control con el resumen de evaluaciones activas y métricas de postulantes.
* **Gestión de Candidatos**: Tabla centralizada con el estado del proceso de cada postulante (Pendiente, Aprobado, Rechazado).
* **Formularios de Evaluación**: Interfaces para la captura de datos, registro de entrevistas y carga de resultados de pruebas psicolaborales.
* **Generación de Informes**: Vista consolidada del perfil psicolaboral para su revisión y exportación.

## Requisitos Previos
Para la ejecución del proyecto en un entorno local, se requiere contar con Node.js (versión 18 o superior), el cual incluye por defecto el gestor de paquetes npm.

## Instrucciones de Instalación y Ejecución Local
1. Clonar el repositorio y acceder al directorio raíz del proyecto.
2. Ingresar al directorio del frontend e iniciar el cliente:
   ```bash
   cd frontend
   npm run dev
