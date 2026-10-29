import { Link } from 'react-router-dom';

export default function Privacidad() {
  return (
    <div className="pagina-legal">
      <section className="hero-postulacion hero-legal">
        <div className="contenedor">
          <span className="hero-etiqueta">Protección de datos</span>
          <h1>Política de privacidad</h1>
          <p>
            Cómo tratamos la información de las personas que postulan a través de esta plataforma.
          </p>
        </div>
      </section>

      <section className="contenedor seccion-legal">
        <article className="legal-panel">
          <p className="legal-fecha">Última actualización: octubre de 2026</p>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            AquaChile es responsable de los datos personales tratados en esta plataforma de
            postulación y evaluación psicolaboral. Para consultas sobre privacidad puedes escribir a{' '}
            <a href="mailto:reclutamiento@aquachile.cl">reclutamiento@aquachile.cl</a>.
          </p>

          <h2>2. Datos que recopilamos</h2>
          <p>Al completar una postulación tratamos, según corresponda, los siguientes datos:</p>
          <ul>
            <li>Datos de identificación y contacto: nombre, RUT, correo electrónico y teléfono.</li>
            <li>Antecedentes laborales y académicos: cargo, formación, experiencia y motivación.</li>
            <li>Documentos adjuntos: currículum vitae, certificados, títulos y antecedentes complementarios.</li>
            <li>Resultados del proceso: estado de la postulación, historial de etapas y evaluación psicolaboral.</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <p>
            Usamos tus datos para recibir y gestionar tu postulación, revisar tus antecedentes,
            realizar la evaluación psicolaboral, comunicar el avance del proceso y cumplir las
            obligaciones legales asociadas a la selección de personal. No utilizamos tus datos para
            fines distintos sin informarte previamente.
          </p>

          <h2>4. Base de licitud</h2>
          <p>
            El tratamiento se basa en el consentimiento que otorgas al aceptar esta política al
            momento de enviar tu postulación. Puedes retirar tu consentimiento o solicitar la
            eliminación de tus datos contactando a Reclutamiento, sin que ello afecte la legalidad
            del tratamiento realizado previamente.
          </p>

          <h2>5. Conservación</h2>
          <p>
            Conservamos las postulaciones y sus antecedentes por 12 meses contados desde la última
            actualización del proceso, salvo que la ley exija un plazo distinto o que exista una
            relación contractual vigente. Cumplido ese plazo, los datos se eliminan o se bloquean
            de forma segura.
          </p>

          <h2>6. Acceso y comunicaciones</h2>
          <p>
            Solo accede a tus antecedentes el equipo de Reclutamiento y las personas autorizadas
            para la evaluación del proceso. Podemos apoyarnos en proveedores tecnológicos que
            almacenan o procesan información por cuenta de AquaChile, bajo deberes de
            confidencialidad y seguridad. No vendemos ni cedemos tus datos a terceros para fines
            publicitarios.
          </p>

          <h2>7. Decisiones sobre la postulación</h2>
          <p>
            La plataforma puede generar un apoyo automático de afinidad entre el currículum y el
            cargo, basado en reglas de coincidencia de texto. Ese resultado es referencial y no
            reemplaza la revisión profesional. Las decisiones que afectan tu postulación son
            adoptadas por personas del equipo de Reclutamiento.
          </p>

          <h2>8. Tus derechos</h2>
          <p>
            Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus
            datos personales, así como pedir información sobre su uso. Escríbenos a{' '}
            <a href="mailto:reclutamiento@aquachile.cl">reclutamiento@aquachile.cl</a> indicando tu
            nombre, RUT y el derecho que deseas ejercer. Responderemos dentro de los plazos que
            establece la normativa aplicable.
          </p>

          <h2>9. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y administrativas razonables para proteger la información,
            incluyendo control de acceso por roles, registro de cambios y resguardo de los
            documentos adjuntos. Ningún sistema es completamente infalible, pero trabajamos para
            prevenir accesos no autorizados, pérdida o alteración de los datos.
          </p>

          <h2>10. Personas menores de edad</h2>
          <p>
            Esta plataforma está dirigida a personas mayores de 18 años. Si detectamos una
            postulación de una persona menor de edad, la eliminaremos y contactaremos a su
            representante cuando corresponda.
          </p>

          <h2>11. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política para reflejar cambios en el tratamiento o en la
            normativa. Publicaremos la versión vigente en esta misma página e indicaremos la fecha
            de actualización.
          </p>

          <div className="legal-acciones">
            <Link to="/postulacion" className="boton boton-primario">
              Volver a la postulación
            </Link>
            <Link to="/consulta" className="boton boton-secundario">
              Consultar mi estado
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
