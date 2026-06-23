"use client";

import Link from "next/link";
import { ArrowRight, Factory, Thermometer, Wind, Gauge, Play } from "lucide-react";

interface HeroProps {
  branding: Record<string, any>;
}

export default function HeroSection({ branding }: HeroProps) {
  const siteName = branding.nombre_comercial || "AeroMax Industrial";
  const accent = branding.color_primario || "#0ea5e9";

  return (
    <section className="relative min-h-screen flex items-center bg-zinc-950 overflow-hidden">
      {/* Video background layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          poster="/video_hero.mp4"
          style={{ opacity: 0.25 }}
        >
          <source src="/video_hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950 pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-zinc-950/70 via-transparent to-zinc-950/30 pointer-events-none" />

      {/* Subtle radial glow behind content */}
      <div
        className="absolute top-1/3 left-1/4 w-[800px] h-[600px] rounded-full blur-[180px] z-[1] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)` }}
      />

      {/* Fine geometric pattern overlay */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(255,255,255,0.3) 0.5px, transparent 0.5px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-32 lg:py-44">
        <div className="max-w-3xl">
          {/* Status indicator */}
          <div className="inline-flex items-center gap-2.5 mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[13px] font-medium text-zinc-400 tracking-wide">
              Ingeniería de ventilación industrial · Colombia
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white leading-[0.95] mb-8">
            Ventilación industrial
            <br />
            <span className="text-zinc-500">que no falla cuando</span>
            <br />
            <span style={{ color: accent }}>tu producción lo exige</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed mb-12 max-w-xl">
            Diagnosticamos tu problema real antes de recomendarte nada.
            Ingeniería aplicada a siderurgia, cemento, alimentos, data centers
            y operaciones que no pueden parar.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              href="#diagnostico"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-[15px] font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20"
              style={{ backgroundColor: accent }}
            >
              Diagnóstico gratuito
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#soluciones"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-[15px] font-medium text-white border border-zinc-700/80 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              Ver cómo trabajamos
            </Link>
          </div>

          {/* KPI metrics row */}
          <div className="grid grid-cols-3 gap-12 max-w-lg">
            {[
              {
                value: "+500",
                label: "Plantas intervenidas en Latinoamérica",
                icon: Factory,
              },
              {
                value: "−15°C",
                label: "Reducción térmica promedio en nave industrial",
                icon: Thermometer,
              },
              {
                value: "< 72h",
                label: "Tiempo de respuesta con diagnóstico técnico",
                icon: Gauge,
              },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label}>
                <div className="text-2xl font-display font-bold text-white tracking-tight mb-1.5">
                  {value}
                </div>
                <div className="flex items-start gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-zinc-500 leading-tight">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
