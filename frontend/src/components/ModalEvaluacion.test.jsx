import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import ModalEvaluacion from './ModalEvaluacion.jsx';
vi.mock('../services/api.js', () => ({ api: { get: vi.fn(), post: vi.fn(), descargarCv: vi.fn(), descargar: vi.fn() } }));
const cuestionario = { dimensiones: [{ id: 'd', nombre: 'Colaboración' }], preguntas: [{ id: 'p1', dimension: 'd', texto: '¿Colabora?', peso: 1, invertida: false }], opciones: [1, 2, 3, 4, 5].map((valor) => ({ valor, etiqueta: `Opción ${valor}` })) };
const candidato = { id: 7, nombre: 'Ana Pérez', rut: '12345678-5', folio: 'F-7', cargo: 'Operadora', familiaCargo: 'Planta', correo: 'ana@example.cl', telefono: '+56912345678', aniosExperiencia: 3, formacion: 'Técnica', disponibilidad: 'Inmediata', fechaPostulacion: '2026-01-10', estado: 'Pendiente', archivos: [{ id: 1, tipo: 'cv', nombreOriginal: 'ana.pdf' }, { id: 2, tipo: 'otro', nombreOriginal: 'cert.pdf' }] };
const props = { candidato, cuestionario, estados: ['Pendiente', 'Aprobado'], onCerrar: vi.fn(), onGuardar: vi.fn(), onCambiarEstado: vi.fn(), guardando: false };
beforeEach(() => { vi.clearAllMocks(); document.body.style.overflow = ''; }); afterEach(cleanup);
const mount = (extra = {}) => render(<ToastProvider><ModalEvaluacion {...props} {...extra} /></ToastProvider>);
describe('ModalEvaluacion', () => {
  it('valida cuestionario, edita observaciones/estado y guarda', async () => {
    const user = userEvent.setup(); mount();
    expect(screen.getByRole('note')).toHaveTextContent(/revisión humana obligatoria/i); expect(screen.getByText('Faltan 1 respuesta')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Opción 5/i })); await user.type(screen.getByLabelText('Observaciones del evaluador'), 'Revisar experiencia');
    await user.selectOptions(screen.getByLabelText('Estado del proceso'), 'Aprobado'); expect(props.onCambiarEstado).toHaveBeenCalledWith(7, 'Aprobado');
    await user.click(screen.getByRole('button', { name: /Guardar evaluación/i })); expect(props.onGuardar).toHaveBeenCalledWith(7, expect.objectContaining({ observaciones: 'Revisar experiencia', estado: 'Aprobado', respuestas: { p1: 5 } }));
    expect(document.body.style.overflow).toBe('hidden');
  });
  it('genera asistencia, muestra criterios/limitaciones/ranking y copia borrador', async () => {
    const user = userEvent.setup(); api.post.mockResolvedValue({ asistencia: { resumen: 'Perfil alineado', afinidad: 85, semaforo: 'alto', criterios_usados: ['experiencia', 'formación'], limitaciones: 'CV parcial', coincidencias: ['planta'], faltantes: ['licencia'], borrador: 'Entrevistar por competencias' } }); api.get.mockResolvedValue({ posicion: 1, total: 2 });
    mount(); await user.click(screen.getByRole('button', { name: /Generar asistencia/i })); await screen.findByText('Perfil alineado');
    expect(screen.getByText('experiencia')).toBeInTheDocument(); expect(screen.getByText('CV parcial')).toBeInTheDocument(); expect(await screen.findByText(/N° 1 de 2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Usar como observaciones/i })); expect(screen.getByLabelText('Observaciones del evaluador')).toHaveValue('Entrevistar por competencias');
  });
  it('soporta fallos de asistencia/descarga, documentos, Escape y cierre por overlay', async () => {
    const user = userEvent.setup(); api.post.mockRejectedValue(new Error('IA indisponible')); api.descargarCv.mockRejectedValue(new Error('CV no disponible')); api.descargar.mockResolvedValue(undefined);
    const view = mount(); await user.click(screen.getByText('Ver CV')); await waitFor(() => expect(api.descargarCv).toHaveBeenCalledWith(7, 'ana.pdf'));
    await user.click(screen.getByText('cert.pdf')); expect(api.descargar).toHaveBeenCalledWith('/candidatos/7/archivos/2', 'cert.pdf');
    await user.click(screen.getByRole('button', { name: /Generar asistencia/i })); await screen.findByText('IA indisponible');
    fireEvent.keyDown(document, { key: 'Escape' }); expect(props.onCerrar).toHaveBeenCalled(); view.unmount(); expect(document.body.style.overflow).toBe('');
  });
  it('acepta respuestas precargadas y sin CV; muestra asistencia existente', () => {
    mount({ candidato: { ...candidato, respuestas: { p1: 4 }, archivos: [], resumenIA: 'Resumen previo', afinidadIA: 101, borradorIA: 'Nota previa' } });
    expect(screen.getByText('Resumen previo')).toBeInTheDocument(); expect(screen.getByText('El candidato no adjuntó documentos.')).toBeInTheDocument(); expect(api.get).toHaveBeenCalled();
  });
});
