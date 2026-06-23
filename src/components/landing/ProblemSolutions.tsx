"use client";

import { Thermometer, Wind, Droplets, VolumeX, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

interface ProblemSolutionsProps {
  branding: Record<string, any>;
}

export default function ProblemSolutions({ branding }: ProblemSolutionsProps) {
  const accent = branding.color_primario || "#0ea5e9";

  const problems = [
    {
      icon: Thermometer,
      number: "01",
      problem: "Calor extremo que reduce turnos productivos",
      pain: "Tu planta opera a +45°C entre febrero y mayo. Los operarios solo rinden media jornada. Tu producción cae 30% cada verano y los plazos de entrega se quiebran.",
      solution: "Sistema de extracción forzada + inyección de aire fresco con control térmico automatizado. Reducción comprobada de 10°C a 18°C en nave industrial, recuperando el 100% de tu capacidad operativa sin importar la temporada.",
      metrics: ["Recuperación total de turnos", "ROI en menos de 8 meses", "Cumplimiento RETIE"],
    },
    {
      icon: Wind,
      number: "02",
      problem: "Contaminantes suspendidos que afectan salud y norma",
      pain: "Humos de soldadura, polvo de cemento, vapores químicos, partículas metálicas. Tus operarios usan doble protección. Hay incidentes respiratorios. La autoridad ambiental notificó.",
      solution: "Captación localizada con filtración multietapa: ciclón + mangas + carbón activado. Eficiencia comprobada de 99.7% en retención de partículas. Cumplís OSHA y normativa ambiental colombiana sin sobrecostos.",
      metrics: ["99.7% eficiencia filtración", "Cumplimiento OSHA/RETIE", "Reducción de incapacidades"],
    },
    {
      icon: Droplets,
      number: "03",
      problem: "Humedad que deteriora producto, maquinaria e infraestructura",
      pain: "Condensación en techos industriales, corrosión prematura en equipos, empaques deformados, producto terminado rechazado por hongos. Tu bodega de 2 años parece de 15.",
      solution: "Ventilación cruzada con control higrométrico automático por sensores. Los extractores operan solo cuando la humedad relativa supera el umbral. Sin gastar energía innecesaria. Humedad controlada por debajo del 55%.",
      metrics: ["Humedad < 55% garantizada", "Ahorro energético 40%", "Protección de inventario"],
    },
    {
      icon: VolumeX,
      number: "04",
      problem: "Ruido industrial que impide operar de noche",
      pain: "Tus extractores actuales generan +90 dBA. Vecinos y autoridad ambiental presionan. No podés operar el tercer turno. Perdés capacidad instalada.",
      solution: "Unidades encapsuladas con atenuación acústica de doble cámara y difusores. Reducción certificada a menos de 65 dBA en perímetro manteniendo el caudal. Operación 24/7 sin conflictos.",
      metrics: ["Reducción de −25 dBA", "Operación 24/7 habilitada", "Sin quejas vecinales"],
    },
  ];

  return (
    <section id="soluciones" className="relative bg-zinc-950 py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="mb-20">
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 block">
            Problemas que resolvemos
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.05] max-w-3xl">
            No fabricamos ventiladores.
            <br />
            <span className="text-zinc-400">Eliminamos lo que frena tu operación.</span>
          </h2>
        </div>

        {/* Problems — 2x2 grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {problems.map((item) => (
            <div
              key={item.number}
              className="group relative bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 lg:p-10 hover:border-zinc-700/70 transition-all duration-500"
            >
              {/* Number watermark */}
              <span className="absolute top-6 right-8 text-7xl font-display font-bold text-zinc-800/20 select-none pointer-events-none tabular-nums">
                {item.number}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 ring-1 ring-inset"
                style={{
                  backgroundColor: `${accent}12`,
                  borderColor: `${accent}30`,
                }}
              >
                <item.icon className="w-5 h-5" style={{ color: accent }} />
              </div>

              {/* Problem title */}
              <h3 className="text-xl font-display font-bold text-white mb-3">
                {item.problem}
              </h3>

              {/* Pain — makes the user feel understood */}
              <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                {item.pain}
              </p>

              {/* Divider */}
              <div className="w-12 h-px bg-zinc-800 mb-5" />

              {/* Solution */}
              <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                <span className="font-semibold text-white">Nuestra solución: </span>
                {item.solution}
              </p>

              {/* Metrics tags */}
              <div className="flex flex-wrap gap-2">
                {item.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800/60 text-zinc-300 border border-zinc-700/30"
                  >
                    <Check className="w-3 h-3 text-emerald-500" />
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-sm mb-5 max-w-lg mx-auto">
            ¿Tu problema no aparece? Envianos tu caso. Un ingeniero especializado lo analiza y te responde con una recomendación técnica sin costo.
          </p>
          <Link
            href="#contacto"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-black transition-all duration-300 hover:scale-[1.02]"
            style={{ backgroundColor: accent }}
          >
            Describir mi problema
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
