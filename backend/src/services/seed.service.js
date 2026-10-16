import crypto from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { dbCandidatos, dbHistorial, migrarJsonSiExiste, migrarLegado } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { ESTADOS_PROCESO } from '../domain/constantes.js';
import { logger } from '../utils/logger.js';
import { buscarPorEmail, crearAnalista, crearEvaluador } from './auth.service.js';
import { evaluarRespuestas } from './evaluacion.service.js';

const RONDAS_DEMO = [
  { dias: 1, nombre: 'Camila Rojas Peña', rut: '18.452.913-7', correo: 'camila.rojas@correo.cl', telefono: '955112233', familiaCargo: 'Técnico B/C', cargo: 'Monitor Producción', formacion: 'Técnico', disponibilidad: 'Inmediata', aniosExperiencia: 4, estado: ESTADOS_PROCESO.APROBADO, respuestas: { p1: 5, p2: 4, p3: 5, p4: 4, p5: 5, p6: 4, p7: 5, p8: 5, p9: 5, p10: 5 }, motivacion: 'Busco consolidar mi trayectoria en procesamiento primario.' },
  { dias: 3, nombre: 'Rodrigo Fuentes Alarcón', rut: '16.781.204-2', correo: 'rodrigo.fuentes@correo.cl', telefono: '944223344', familiaCargo: 'Profesional B/C', cargo: 'Analista de Sistemas', formacion: 'Profesional', disponibilidad: '30 días', aniosExperiencia: 6, estado: ESTADOS_PROCESO.APROBADO, respuestas: { p1: 4, p2: 5, p3: 4, p4: 5, p5: 4, p6: 5, p7: 4, p8: 5, p9: 4, p10: 5 }, motivacion: 'Me interesa la digitalización de operaciones en planta.' },
  { dias: 5, nombre: 'Fernanda Ñanco Vidal', rut: '19.334.771-K', correo: 'fernanda.nanco@correo.cl', telefono: '933334455', familiaCargo: 'Profesional A', cargo: 'Líder Desarrollo Producción', formacion: 'Magíster', disponibilidad: '60 días', aniosExperiencia: 9, estado: ESTADOS_PROCESO.EN_PROCESO, respuestas: null, motivacion: 'Quiero liderar proyectos de mejora continua.' },
  { dias: 8, nombre: 'Matías Soto Contreras', rut: '15.992.008-4', correo: 'matias.soto@correo.cl', telefono: '922445566', familiaCargo: 'Operario Calificado', cargo: 'Gruero', formacion: 'Técnico', disponibilidad: 'Inmediata', aniosExperiencia: 12, estado: ESTADOS_PROCESO.APROBADO, respuestas: { p1: 4, p2: 4, p3: 4, p4: 3, p5: 5, p6: 4, p7: 4, p8: 5, p9: 5, p10: 5 }, motivacion: 'Más de una década operando grúas en terminal.' },
  { dias: 12, nombre: 'Javiera Bustos Loyola', rut: '20.115.660-3', correo: 'javiera.bustos@correo.cl', telefono: '911556677', familiaCargo: 'Técnico B/C', cargo: 'Asistente Bodega Planta', formacion: 'Técnico', disponibilidad: '15 días', aniosExperiencia: 2, estado: ESTADOS_PROCESO.RECHAZADO, respuestas: { p1: 3, p2: 2, p3: 2, p4: 3, p5: 3, p6: 2, p7: 3, p8: 3, p9: 4, p10: 4 }, motivacion: 'Busco mi primer rol formal en planta.' },
  { dias: 15, nombre: 'Ignacio Vergara Ruiz', rut: '17.220.985-1', correo: 'ignacio.vergara@correo.cl', telefono: '966778899', familiaCargo: 'Técnico B/C', cargo: 'Operador Sala Control', formacion: 'Técnico', disponibilidad: '30 días', aniosExperiencia: 7, estado: ESTADOS_PROCESO.EN_PROCESO, respuestas: null, motivacion: 'Experiencia en SCADA y salas de control.' },
  { dias: 22, nombre: 'Daniela Cárdenas Muñoz', rut: '18.774.509-6', correo: 'daniela.cardenas@correo.cl', telefono: '988990011', familiaCargo: 'Profesional B/C', cargo: 'Coordinador Servicios Generales', formacion: 'Profesional', disponibilidad: 'Inmediata', aniosExperiencia: 5, estado: ESTADOS_PROCESO.PENDIENTE, respuestas: null, motivacion: 'Coordinación de equipos de apoyo operacional.' },
  { dias: 34, nombre: 'Sebastián Pino Oyarzún', rut: '14.556.773-8', correo: 'sebastian.pino@correo.cl', telefono: '955001122', familiaCargo: 'Operario Calificado', cargo: 'Gruero', formacion: 'Técnico', disponibilidad: 'Inmediata', aniosExperiencia: 15, estado: ESTADOS_PROCESO.APROBADO, respuestas: { p1: 5, p2: 4, p3: 5, p4: 4, p5: 4, p6: 5, p7: 4, p8: 5, p9: 5, p10: 5 }, motivacion: 'Retorno a la compañía con experiencia certificada.' },
  { dias: 41, nombre: 'Antonia Melinao Pérez', rut: '19.887.221-5', correo: 'antonia.melinao@correo.cl', telefono: '933112244', familiaCargo: 'Técnico B/C', cargo: 'Monitor Producción', formacion: 'Profesional', disponibilidad: '15 días', aniosExperiencia: 3, estado: ESTADOS_PROCESO.PENDIENTE, respuestas: null, motivacion: 'Monitoreo de indicadores de proceso.' },
  { dias: 48, nombre: 'Carlos Espinoza Vera', rut: '13.445.992-0', correo: 'carlos.espinoza@correo.cl', telefono: '944667788', familiaCargo: 'Profesional A', cargo: 'Líder Desarrollo Producción', formacion: 'Profesional', disponibilidad: '60 días', aniosExperiencia: 11, estado: ESTADOS_PROCESO.RECHAZADO, respuestas: { p1: 3, p2: 3, p3: 2, p4: 3, p5: 2, p6: 3, p7: 2, p8: 3, p9: 3, p10: 4 }, motivacion: 'Liderazgo de proyectos productivos.' },
];

const fechaAnterior = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString();
};

const sembrarEvaluador = async () => {
  const { email, nombre, password } = entorno.evaluador;
  if ((await buscarPorEmail(email)) || !email || !password) {
    return;
  }
  await crearEvaluador({ nombre, email, password });
  logger.info('Cuenta de evaluador inicializada');
};

const sembrarAnalista = async () => {
  const { email, nombre, password } = entorno.analista;
  if ((await buscarPorEmail(email)) || !email || !password) {
    return;
  }
  await crearAnalista({ nombre, email, password });
  logger.info('Cuenta de analista inicializada');
};

const sembrarDemo = async () => {
  if ((await dbCandidatos.contar()) > 0) {
    return;
  }

  for (const demo of RONDAS_DEMO) {
    const evaluacion = demo.respuestas ? evaluarRespuestas(demo.respuestas) : null;
    const fechaPostulacion = fechaAnterior(demo.dias);
    const creado = await dbCandidatos.insertar({
      id: crypto.randomUUID(),
      folio: `AQ-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      nombre: demo.nombre,
      rut: demo.rut,
      correo: demo.correo,
      telefono: demo.telefono,
      familiaCargo: demo.familiaCargo,
      cargo: demo.cargo,
      formacion: demo.formacion,
      disponibilidad: demo.disponibilidad,
      aniosExperiencia: demo.aniosExperiencia,
      motivacion: demo.motivacion,
      estado: demo.estado,
      respuestas: demo.respuestas,
      puntaje: evaluacion?.puntaje ?? null,
      dimensiones: evaluacion?.dimensiones ?? [],
      idoneidad: evaluacion?.idoneidad ?? null,
      observaciones: evaluacion ? 'Evaluación registrada en el ciclo de contratación.' : null,
      evaluadoPor: evaluacion ? entorno.evaluador.email || null : null,
      fechaEvaluacion: evaluacion ? fechaPostulacion : null,
      archivos: [],
      fechaPostulacion,
      fechaActualizacion: fechaPostulacion,
    });
    await dbHistorial.registrar({
      candidatoId: creado.id,
      etapaAnterior: null,
      etapaNueva: demo.estado,
      responsable: 'sistema',
      motivo: 'Registro inicial del candidato',
    });
  }

  logger.info(`Lote demostrativo cargado: ${RONDAS_DEMO.length} candidatos`);
};

export const inicializarBaseDatos = async () => {
  await Promise.all([
    mkdir(entorno.directorios.uploads, { recursive: true }),
    mkdir(entorno.directorios.datos, { recursive: true }),
  ]);
  await migrarJsonSiExiste();
  await migrarLegado();
  await sembrarEvaluador();
  await sembrarAnalista();
  if (entorno.seedDemo) {
    await sembrarDemo();
  }
};