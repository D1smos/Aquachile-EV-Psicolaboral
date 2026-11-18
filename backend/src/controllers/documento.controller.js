import { ErrorHttp } from '../utils/ErrorHttp.js';
import { envolver } from '../utils/envolver.js';
import { TIPOS_DOCUMENTO } from '../domain/constantes.js';
import { obtenerCandidato } from '../services/candidato.service.js';
import {
  eliminarDocumento,
  guardarDocumento,
  obtenerTextoDocumento,
  reprocesarDocumento,
  resumenDocumento,
} from '../services/documentos/documento.service.js';

const TIPOS_VALIDOS = new Set(Object.values(TIPOS_DOCUMENTO));

const archivoDePeticion = (req) =>
  req.files?.archivo?.[0] ?? req.files?.documento?.[0] ?? req.file ?? null;

export const subirDocumento = envolver(async (req, res) => {
  const tipo = String(req.body?.tipo ?? '').trim().toLowerCase();
  if (!TIPOS_VALIDOS.has(tipo)) {
    throw new ErrorHttp('Tipo de documento no válido', 400, [
      { campo: 'tipo', mensaje: `Usa uno de: ${[...TIPOS_VALIDOS].join(', ')}` },
    ]);
  }
  const archivo = archivoDePeticion(req);
  if (!archivo) {
    throw new ErrorHttp('Adjunta un archivo en el campo "archivo"', 400, [
      { campo: 'archivo', mensaje: 'Archivo requerido' },
    ]);
  }

  const candidato = await obtenerCandidato(req.params.id);
  const resultado = await guardarDocumento({ candidatoId: candidato.id, tipo, archivo });
  res.status(201).json({
    ok: true,
    mensaje: 'Documento cargado y texto extraído',
    archivo: resultado.archivo,
    documento: resumenDocumento(resultado.documento),
  });
});

export const textoDocumento = envolver(async (req, res) => {
  await obtenerCandidato(req.params.id);
  const { archivo, documento } = await obtenerTextoDocumento(
    req.params.id,
    req.params.archivoId,
  );
  res.json({
    ok: true,
    archivoId: archivo.id,
    nombreOriginal: archivo.nombreOriginal,
    tipo: archivo.tipo,
    estado: documento.estado,
    texto: documento.texto,
    paginas: documento.paginas,
    caracteres: documento.caracteres,
    anosExperiencia: documento.anosExperiencia,
    palabrasClave: documento.palabrasClave,
    modeloExtraccion: documento.modeloExtraccion,
    error: documento.error,
    extraidoEn: documento.extraidoEn,
  });
});

export const reprocesarDocumentoController = envolver(async (req, res) => {
  await obtenerCandidato(req.params.id);
  const resultado = await reprocesarDocumento(req.params.id, req.params.archivoId);
  res.json({
    ok: true,
    mensaje: 'Documento reprocesado',
    archivo: resultado.archivo,
    documento: resumenDocumento(resultado.documento),
  });
});

export const eliminarDocumentoController = envolver(async (req, res) => {
  const candidato = await obtenerCandidato(req.params.id);
  const archivo = await eliminarDocumento(candidato.id, req.params.archivoId);
  res.json({
    ok: true,
    mensaje: `Documento "${archivo.nombreOriginal}" eliminado`,
    archivoId: archivo.id,
  });
});
