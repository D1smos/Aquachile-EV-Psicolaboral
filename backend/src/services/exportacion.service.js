import PDFDocument from 'pdfkit';
import { obtenerCandidato, obtenerHistorial } from './candidato.service.js';

const CABECERAS_CSV = [
  'folio',
  'nombre',
  'rut',
  'correo',
  'telefono',
  'familiaCargo',
  'cargo',
  'formacion',
  'aniosExperiencia',
  'disponibilidad',
  'estado',
  'puntaje',
  'idoneidad',
  'fechaPostulacion',
];

const escaparCsv = (valor) => {
  const texto = String(valor ?? '');
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const filtrarParaExportar = (candidatos, filtros = {}) => {
  const busqueda = normalizar(filtros.busqueda).trim();
  const estado = String(filtros.estado ?? '').trim();
  const cargo = String(filtros.cargo ?? '').trim();
  const desde = String(filtros.desde ?? '').trim();
  const hasta = String(filtros.hasta ?? '').trim();
  return candidatos.filter((candidato) => {
    if (estado && candidato.estado !== estado) {
      return false;
    }
    if (cargo && candidato.cargo !== cargo) {
      return false;
    }
    if (desde && String(candidato.fechaPostulacion ?? '') < desde) {
      return false;
    }
    if (hasta && String(candidato.fechaPostulacion ?? '') > `${hasta}T23:59:59.999Z`) {
      return false;
    }
    if (busqueda) {
      const texto = normalizar(
        `${candidato.nombre} ${candidato.rut} ${candidato.correo} ${candidato.folio}`,
      );
      if (!texto.includes(busqueda)) {
        return false;
      }
    }
    return true;
  });
};

export const generarCsv = (candidatos) => {
  const filas = candidatos.map((candidato) =>
    [
      candidato.folio,
      candidato.nombre,
      candidato.rut,
      candidato.correo,
      candidato.telefono,
      candidato.familiaCargo,
      candidato.cargo,
      candidato.formacion,
      candidato.aniosExperiencia,
      candidato.disponibilidad,
      candidato.estado,
      candidato.puntaje,
      candidato.idoneidad,
      candidato.fechaPostulacion,
    ]
      .map(escaparCsv)
      .join(';'),
  );
  const encabezado = CABECERAS_CSV.join(';');
  const cuerpo = filas.join('\n');
  return String.fromCharCode(0xfeff) + encabezado + '\n' + cuerpo + '\n';
};

const linea = (doc, etiqueta, valor) => {
  doc.font('Helvetica-Bold').text(`${etiqueta}: `, { continued: true });
  doc.font('Helvetica').text(String(valor ?? '—'));
};

export const generarInformePdf = (candidatoId) =>
  obtenerCandidato(candidatoId).then(
    (candidato) =>
      new Promise((resolver, rechazar) => {
        obtenerHistorial(candidatoId).then(
          (historial) => {
            const doc = new PDFDocument({
              size: 'A4',
              margin: 50,
              info: { Title: `Ficha ${candidato.folio}`, Author: 'AquaChile' },
            });
            const partes = [];
            doc.on('data', (parte) => partes.push(parte));
            doc.on('error', rechazar);
            doc.on('end', () => resolver(Buffer.concat(partes)));

            doc.fontSize(18).font('Helvetica-Bold').text('Ficha del candidato', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica').text(`Folio ${candidato.folio}`, { align: 'center' });
            doc.moveDown();
            linea(doc, 'Nombre', candidato.nombre);
            linea(doc, 'RUT', candidato.rut);
            linea(doc, 'Correo', candidato.correo);
            linea(doc, 'Teléfono', candidato.telefono);
            linea(doc, 'Cargo', `${candidato.cargo} (${candidato.familiaCargo})`);
            linea(doc, 'Formación', candidato.formacion);
            linea(doc, 'Experiencia', `${candidato.aniosExperiencia} años`);
            linea(doc, 'Disponibilidad', candidato.disponibilidad);
            linea(doc, 'Estado', candidato.estado);
            doc.moveDown();
            doc.fontSize(14).font('Helvetica-Bold').text('Evaluación psicolaboral');
            doc.fontSize(11);
            linea(doc, 'Puntaje', candidato.puntaje ?? 'Sin evaluar');
            linea(doc, 'Idoneidad', candidato.idoneidad ?? 'Sin evaluar');
            linea(doc, 'Observaciones', candidato.observaciones ?? '—');
            if (candidato.resumenIA) {
              doc.moveDown();
              doc.fontSize(14).font('Helvetica-Bold').text('Apoyo automático');
              doc.fontSize(11).font('Helvetica').text(candidato.resumenIA);
              linea(doc, 'Afinidad CV-cargo', `${candidato.afinidadIA ?? '—'}%`);
            }
            doc.moveDown();
            doc.fontSize(14).font('Helvetica-Bold').text('Historial de etapas');
            doc.fontSize(11).font('Helvetica');
            if (historial.length === 0) {
              doc.text('Sin movimientos registrados.');
            }
            for (const evento of historial) {
              const tramo = evento.etapaAnterior
                ? `${evento.etapaAnterior} → ${evento.etapaNueva}`
                : `Registro · ${evento.etapaNueva}`;
              doc.text(`• ${tramo} — ${evento.creadoEn} ${evento.responsable ? `(${evento.responsable})` : ''}`);
              if (evento.motivo) {
                doc.text(`  ${evento.motivo}`);
              }
            }
            doc.moveDown();
            doc.fontSize(9).font('Helvetica-Oblique').text('Documento generado por el sistema de evaluaciones psicolaborales AquaChile.');
            doc.end();
          },
          rechazar,
        );
      }),
  );
