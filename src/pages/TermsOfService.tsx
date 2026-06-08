import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 space-y-12">
      <header className="space-y-4">
        <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">TÉRMINOS <span className="text-primary">DE SERVICIO</span></h1>
        <p className="text-on-surface-variant font-medium text-lg italic">Versión 1.0 - Actualizado Mayo 2026</p>
      </header>

      <div className="prose prose-stone prose-invert max-w-none space-y-8 text-on-surface-variant font-medium">
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight italic text-on-surface">1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar QueSale Geek, aceptas cumplir con estos Términos de Servicio. Esta plataforma está diseñada para la comunidad geek y cualquier uso indebido resultará en la suspensión inmediata de la cuenta.
          </p>
        </section>

        <section className="space-y-4">
           <h2 className="text-2xl font-black uppercase tracking-tight italic text-on-surface">2. Comportamiento de la Comunidad</h2>
           <p>
             Mantenemos un ambiente de respeto. No se permite el acoso, la discriminación ni la publicación de contenido ofensivo en los muros de eventos o perfiles de usuario.
           </p>
        </section>

        <section className="space-y-4">
           <h2 className="text-2xl font-black uppercase tracking-tight italic text-on-surface">3. Responsabilidad de Eventos</h2>
           <p>
             QueSale Geek actúa como interlocutor y plataforma de descubrimiento. La organización real, seguridad y ejecución de los eventos es responsabilidad exclusiva de los Organizadores verificados.
           </p>
        </section>

        <section className="space-y-4">
           <h2 className="text-2xl font-black uppercase tracking-tight italic text-on-surface">4. Privacidad</h2>
           <p>
             Tus datos son sagrados. Solo compartimos la información necesaria para el funcionamiento social de la app y la gestión de entradas con los organizadores correspondientes.
           </p>
        </section>

        <section className="space-y-12 pt-12 border-t border-outline-variant/30">
           <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant">
              <p className="text-xs italic leading-relaxed">
                "Que el radar nunca deje de parpadear y que siempre encuentres una comunidad donde pertenecer."
              </p>
           </div>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
