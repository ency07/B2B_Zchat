"use client";

import { Wrench, Package, ShieldCheck, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ServicesSectionProps { branding: Record<string, any>; }

export default function ServicesSection({ branding }: ServicesSectionProps) {
  const accent = branding.color_primario || "#0ea5e9";

  const services = [
    {
      icon: Wrench, number: "01",
      title: "Fabricación de equipos",
      desc: "Diseño y construcción de extractores, ventiladores y sistemas de aire para condiciones reales de planta. Cada equipo se dimensiona según tu operación, no según un catálogo estándar.",
      link: "#contacto", linkLabel: "Solicitar fabricación",
    },
    {
      icon: Package, number: "02",
      title: "Suministro industrial",
      desc: "Selección de equipos, motores, repuestos y componentes adecuados para caudal, presión y ambiente de trabajo. Trabajamos con marcas certificadas y garantía de fábrica.",
      link: "#catalogo", linkLabel: "Ver catálogo",
    },
    {
      icon: ShieldCheck, number: "03",
      title: "Mantenimiento preventivo",
      desc: "Inspección, balanceo, revisión mecánica y seguimiento programado para reducir paradas no programadas. Planes trimestrales, semestrales o anuales según criticidad.",
      link: "#contacto", linkLabel: "Solicitar plan",
    },
    {
      icon: Settings, number: "04",
      title: "Reparación en campo",
      desc: "Atención técnica para fallas, vibraciones, daños estructurales, motores y equipos detenidos. Respuesta en menos de 72 horas con diagnóstico en sitio.",
      link: "#contacto", linkLabel: "Solicitar soporte",
    },
  ];

  return (
    <section className="relative bg-zinc-900 py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 block">Servicios</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.05] max-w-4xl">
            Ingeniería de ventilación de{" "}
            <span style={{ color: accent }}>principio a fin</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(s => (
            <div key={s.number} className="group relative bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-6 hover:border-zinc-700/70 transition-all duration-300 flex flex-col">
              <span className="text-5xl font-display font-bold text-zinc-800/30 select-none absolute top-5 right-6">{s.number}</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${accent}15` }}>
                <s.icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <h3 className="text-base font-display font-bold text-white mb-3">{s.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6 flex-1">{s.desc}</p>
              <Link href={s.link}
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:gap-2"
                style={{ color: accent }}>
                {s.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
