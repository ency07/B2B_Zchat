"use client";

import { useState } from "react";
import { Award, Factory, Shield, CheckCircle, ArrowRight } from "lucide-react";

interface AboutSectionProps { branding: Record<string, any>; }

export default function AboutSection({ branding }: AboutSectionProps) {
  const accent = branding.color_primario || "#0ea5e9";
  const siteName = branding.nombre_comercial || "AeroMax Industrial";
  const [tab, setTab] = useState<"capacidades" | "certificaciones" | "seguridad">("capacidades");

  const tabs = {
    capacidades: {
      title: "Capacidades industriales",
      items: [
        "Diseño CFD (Dinámica de Fluidos Computacional) para validar comportamiento del aire antes de fabricar",
        "Fabricación en acero estructural ASTM A36, inoxidable 304/316 y aleaciones especiales",
        "Balanceo dinámico en fábrica bajo norma ISO 1940-1 Grado G2.5 con certificado de vibración",
        "Pruebas de desempeño AMCA en laboratorio propio: caudal, presión estática, potencia y ruido",
        "Capacidad de producción: hasta 80 equipos/mes en planta de 2,000 m²",
        "Ingeniería de montaje en sitio con grúas, andamios certificados y supervisión HSEQ",
      ],
    },
    certificaciones: {
      title: "Certificaciones y normas",
      items: [
        "RETIE — Reglamento Técnico de Instalaciones Eléctricas (Colombia)",
        "RETILAP — Reglamento Técnico de Iluminación y Alumbrado Público",
        "ISO 1940-1 — Balanceo dinámico de rotores Grado G2.5",
        "AMCA 210/300 — Pruebas de desempeño aerodinámico y sonoro",
        "ASME B73.1 — Especificaciones para bombas centrífugas (aplicable a turbomaquinaria)",
        "OSHA 29 CFR 1910 — Seguridad en ventilación industrial",
      ],
    },
    seguridad: {
      title: "Seguridad industrial & HSEQ",
      items: [
        "Programa de seguridad basada en comportamiento con indicadores proactivos",
        "EPP certificado para trabajo en alturas, espacios confinados y atmósferas explosivas",
        "Plan de emergencias con brigadas entrenadas en primeros auxilios y control de incendios",
        "Gestión ambiental: disposición de residuos metálicos, pinturas y solventes según norma",
        "Exámenes médicos ocupacionales periódicos con énfasis en riesgo respiratorio y auditivo",
        "Índice de frecuencia de accidentalidad: 0.0 en los últimos 3 años",
      ],
    },
  };

  return (
    <section className="relative bg-zinc-950 py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left: brand story */}
          <div className="lg:col-span-2">
            <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 block">Sobre nosotros</span>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-[1.08] mb-6">
              Una década de ingeniería{" "}
              <span style={{ color: accent }}>sin atajos</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              {siteName} nació en 2014 resolviendo el problema más básico de la industria colombiana:
              plantas que no pueden operar porque el aire no circula. Desde entonces hemos intervenido
              más de 500 instalaciones en siderurgia, cemento, alimentos, minería y data centers.
            </p>
            <p className="text-zinc-500 leading-relaxed text-sm">
              No hacemos ventiladores genéricos. Diseñamos sistemas de ventilación que funcionan
              en condiciones reales: altitud, humedad, polvo, calor extremo. Cada solución empieza
              con un diagnóstico en sitio. Sin excepciones.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              {[
                { value: "+500", label: "Plantas intervenidas" },
                { value: "10+", label: "Años de trayectoria" },
                { value: "0.0", label: "Índice de accidentalidad" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-display font-bold text-white">{s.value}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tabs */}
          <div className="lg:col-span-3">
            <div className="flex gap-2 mb-6">
              {([
                { k: "capacidades" as const, label: "Capacidades", icon: Factory },
                { k: "certificaciones" as const, label: "Certificaciones", icon: Award },
                { k: "seguridad" as const, label: "Seguridad", icon: Shield },
              ]).map(({ k, label, icon: Icon }) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                    tab === k ? "bg-white/5 text-white border-white/15" : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-display font-bold text-white mb-6">{tabs[tab].title}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {tabs[tab].items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-300 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
