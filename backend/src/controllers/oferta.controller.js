import crypto from 'node:crypto';
import { dbOfertas } from '../config/baseDatos.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { envolver } from '../utils/envolver.js';

const ESTADOS = new Set(['borrador', 'publicada', 'cerrada']);
const CAMPOS_TEXTO = ['titulo', 'descripcion', 'ubicacion', 'familiaCargo', 'categoria', 'modalidad', 'fechaPublicacion', 'estado', 'funciones', 'requisitos', 'beneficios', 'sueldo'];
const limpiar = (datos = {}) => Object.fromEntries(CAMPOS_TEXTO.filter((campo) => Object.hasOwn(datos, campo)).map((campo) => [campo, String(datos[campo] ?? '').trim()]));
const validar = (oferta) => {
  const faltantes = ['titulo', 'descripcion', 'ubicacion', 'categoria', 'modalidad'].filter((campo) => !oferta[campo]);
  const errores = faltantes.map((campo) => ({ campo, mensaje: 'Este campo es obligatorio' }));
  if (oferta.estado && !ESTADOS.has(oferta.estado)) errores.push({ campo: 'estado', mensaje: 'Estado no válido' });
  if (!Number.isInteger(Number(oferta.cupos)) || Number(oferta.cupos) < 1) errores.push({ campo: 'cupos', mensaje: 'Debe ser un entero positivo' });
  if (errores.length) throw new ErrorHttp('Revisa los datos de la oferta', 400, errores);
};

export const listarOfertasPublicas = envolver(async (req, res) => {
  const ofertas = await dbOfertas.listar({ q: req.query.q, categoria: req.query.categoria, modalidad: req.query.modalidad, estado: 'publicada' });
  res.json({ ok: true, total: ofertas.length, ofertas });
});

export const obtenerOfertaPublica = envolver(async (req, res) => {
  const oferta = await dbOfertas.obtener(req.params.id);
  if (!oferta || oferta.estado !== 'publicada') throw new ErrorHttp('Oferta no encontrada', 404);
  res.json({ ok: true, oferta });
});

export const listarOfertasPrivadas = envolver(async (req, res) => {
  const ofertas = await dbOfertas.listar(req.query);
  res.json({ ok: true, total: ofertas.length, ofertas });
});

export const crearOferta = envolver(async (req, res) => {
  const datos = limpiar(req.body);
  datos.estado ||= 'borrador';
  datos.familiaCargo ||= datos.categoria;
  datos.fechaPublicacion ||= new Date().toISOString().slice(0, 10);
  datos.cupos = Number(req.body?.cupos ?? 1);
  for (const campo of ['funciones', 'requisitos', 'beneficios', 'sueldo']) datos[campo] ||= '';
  validar(datos);
  const ahora = new Date().toISOString();
  const oferta = await dbOfertas.insertar({ id: crypto.randomUUID(), ...datos, creadoEn: ahora, actualizadoEn: ahora });
  res.status(201).json({ ok: true, oferta });
});

export const actualizarOferta = envolver(async (req, res) => {
  const existente = await dbOfertas.obtener(req.params.id);
  if (!existente) throw new ErrorHttp('Oferta no encontrada', 404);
  const datos = { ...existente, ...limpiar(req.body), cupos: Number(req.body?.cupos ?? existente.cupos) };
  validar(datos);
  const oferta = await dbOfertas.actualizar(req.params.id, { ...datos, actualizadoEn: new Date().toISOString() });
  res.json({ ok: true, oferta });
});

export const cambiarEstadoOferta = envolver(async (req, res) => {
  if (!ESTADOS.has(req.body?.estado)) throw new ErrorHttp('Estado de oferta no válido', 400);
  const oferta = await dbOfertas.actualizar(req.params.id, { estado: req.body.estado, actualizadoEn: new Date().toISOString() });
  if (!oferta) throw new ErrorHttp('Oferta no encontrada', 404);
  res.json({ ok: true, oferta });
});

export const eliminarOferta = envolver(async (req, res) => {
  if (!(await dbOfertas.eliminar(req.params.id))) throw new ErrorHttp('Oferta no encontrada', 404);
  res.json({ ok: true, id: req.params.id });
});
