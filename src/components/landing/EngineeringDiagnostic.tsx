"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Wind, ShieldAlert, ArrowRight, Gauge, Zap, Mountain } from "lucide-react";

interface EngineeringDiagnosticProps {
  branding: Record<string, any>;
}

export default function EngineeringDiagnostic({ branding }: EngineeringDiagnosticProps) {
  const accent = branding.color_primario || "#0ea5e9";

  const [largo, setLargo] = useState(30);
  const [ancho, setAncho] = useState(15);
  const [alto, setAlto] = useState(6);
  const [sector, setSector] = useState("fundicion");
  const [altitude, setAltitude] = useState(1500);
  const [temp, setTemp] = useState(30);
  const [ducts, setDucts] = useState("no");

  const [volume, setVolume] = useState(0);
  const [ach, setAch] = useState(0);
  const [cfm, setCfm] = useState(0);
  const [airDensity, setAirDensity] = useState(1.2);
  const [staticPressure, setStaticPressure] = useState(0.5);
  const [powerHp, setPowerHp] = useState(0);
  const [powerKw, setPowerKw] = useState(0);
  const [qtyEquip, setQtyEquip] = useState(0);
  const [distrib, setDistrib] = useState("");
  const [criticality, setCriticality] = useState("");
  const [noiseDba, setNoiseDba] = useState(0);

  const sectorSpecs: Record<string, { ach: number; factor: number; crit: string; critColor: string }> = {
    fundicion: { ach: 45, factor: 1.3, crit: "Crítica — Alta carga térmica. Riesgo de paro operativo.", critColor: "amber" },
    mecanico: { ach: 20, factor: 1.15, crit: "Moderada — Presencia de gases y partículas metálicas.", critColor: "amber" },
    alimentos: { ach: 15, factor: 1.1, crit: "Controlada — Ambiente sanitario con control de temperatura.", critColor: "emerald" },
    datacenter: { ach: 30, factor: 1.0, crit: "Crítica — Temperatura estable para equipos electrónicos.", critColor: "amber" },
    almacen: { ach: 8, factor: 1.0, crit: "Estándar — Renovación de aire para ocupación humana.", critColor: "emerald" },
  };

  useEffect(() => {
    const vol = largo * ancho * alto;
    setVolume(vol);
    const spec = sectorSpecs[sector] || { ach: 10, factor: 1.0, crit: "Baja", critColor: "emerald" };
    setAch(spec.ach);
    setCriticality(spec.crit);
    const density = 1.204 * (293.15 / (273.15 + temp)) * Math.pow(1 - 2.2557e-5 * altitude, 5.25588);
    setAirDensity(density);
    const rawCfm = (vol * spec.ach) / 1.699 * spec.factor;
    setCfm(Math.round(rawCfm));
    const sp = ducts === "si" ? 1.5 : 0.5;
    setStaticPressure(sp);
    const eqCount = Math.max(1, Math.ceil(rawCfm / 7500));
    setQtyEquip(eqCount);
    if (sector === "fundicion" || sector === "datacenter") {
      setDistrib(`${Math.ceil(eqCount / 2)} inyectores + ${Math.floor(eqCount / 2)} extractores`);
    } else {
      setDistrib(`${eqCount} extractores axiales`);
    }
    const hp = (rawCfm * sp) / 6356;
    setPowerHp(Number(hp.toFixed(1)));
    setPowerKw(Number((hp * 0.746 / 0.94).toFixed(1)));
    setNoiseDba(Math.round(68 + 10 * Math.log10(eqCount)));
  }, [largo, ancho, alto, sector, altitude, temp, ducts]);

  return (
    <section id="diagnostico" className="relative bg-zinc-900 py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 block">
            Diagnóstico técnico gratuito
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.05] max-w-4xl mb-6">
            Antes de cotizar,{" "}
            <span style={{ color: accent }}>dimensionemos tu necesidad real</span>
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            Mové los controles con los datos de tu nave. En menos de 10 segundos obtenés
            un predimensionamiento neumático basado en ASHRAE y RETIE. Esta es una orientación
            preliminar — un diagnóstico certero requiere visita de un especialista en sitio.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Inputs — 2 cols */}
          <div className="lg:col-span-2 bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-8">
            {/* Dimensiones */}
            <div className="space-y-5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Dimensiones de la nave
              </span>
              {[
                { label: "Largo", value: largo, set: setLargo, min: 10, max: 150, step: 5, unit: "m" },
                { label: "Ancho", value: ancho, set: setAncho, min: 5, max: 80, step: 5, unit: "m" },
                { label: "Altura libre", value: alto, set: setAlto, min: 3, max: 20, step: 1, unit: "m" },
              ].map(({ label, value, set, min, max, step, unit }) => (
                <div key={label}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="text-sm font-bold text-white font-mono tabular-nums">
                      {value}{unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accent} 0%, ${accent} ${((value - min) / (max - min)) * 100}%, #27272a ${((value - min) / (max - min)) * 100}%, #27272a 100%)`,
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800/60 pt-6 space-y-5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Condiciones del entorno
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-1.5">Sector operativo</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                  >
                    <option value="fundicion">Siderurgia / Fundición</option>
                    <option value="mecanico">Taller mecánico</option>
                    <option value="alimentos">Alimentos</option>
                    <option value="datacenter">Data center</option>
                    <option value="almacen">Bodega / Almacén</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-1.5">Altitud</label>
                  <select
                    value={altitude}
                    onChange={(e) => setAltitude(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                  >
                    <option value="0">0 m · Barranquilla</option>
                    <option value="1000">1,000 m · Bucaramanga</option>
                    <option value="1500">1,500 m · Medellín</option>
                    <option value="2600">2,600 m · Bogotá</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-1.5">Red de ductos</label>
                  <select
                    value={ducts}
                    onChange={(e) => setDucts(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                  >
                    <option value="no">Descarga directa</option>
                    <option value="si">Con ductería</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[11px] text-zinc-500">Temperatura</span>
                    <span className="text-sm font-bold text-white font-mono tabular-nums">{temp}°C</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={5}
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((temp - 10) / 40) * 100}%, #27272a ${((temp - 10) / 40) * 100}%, #27272a 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results — 3 cols */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 flex flex-col h-full">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-6">
                Resultado del diagnóstico
              </span>

              {/* Main CFM metric — hero number */}
              <div className="text-center mb-8 pb-8 border-b border-zinc-800/60">
                <span className="text-xs text-zinc-600 uppercase tracking-widest block mb-2">
                  Caudal requerido
                </span>
                <div className="text-6xl sm:text-7xl font-display font-bold text-white tracking-tight">
                  {cfm.toLocaleString()}
                  <span className="text-xl text-zinc-600 font-normal ml-2">CFM</span>
                </div>
                <span className="text-sm text-zinc-500 mt-2 block">
                  ≈ {Math.round(cfm * 1.7).toLocaleString()} m³/h
                </span>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Volumen nave", value: `${volume.toLocaleString()} m³`, icon: Mountain },
                  { label: "Renovaciones/h", value: `${ach} ACH`, icon: Wind },
                  { label: "Potencia motor", value: `${powerHp} HP`, icon: Zap },
                  { label: "Equipos sugeridos", value: `${qtyEquip} un.`, icon: Gauge },
                  { label: "Densidad corregida", value: `${airDensity.toFixed(2)} kg/m³` },
                  { label: "Ruido estimado", value: `${noiseDba} dBA` },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-3.5 text-center">
                    {Icon && <Icon className="w-3.5 h-3.5 text-zinc-600 mx-auto mb-1.5" />}
                    <span className="text-[10px] text-zinc-500 block mb-0.5">{label}</span>
                    <span className="text-sm font-bold text-white font-mono">{value}</span>
                  </div>
                ))}
              </div>

              {/* Criticality */}
              <div className="flex items-start gap-3 p-4 bg-amber-500/[0.04] border border-amber-500/15 rounded-xl mb-8">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[13px] font-semibold text-amber-400 block mb-1">
                    {criticality}
                  </span>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Densidad corregida: {airDensity.toFixed(2)} kg/m³. Distribución: {distrib}. Presión estática: {staticPressure} inWG.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/wizard?length=${largo}&width=${ancho}&height=${alto}&environment=${sector}&altitude=${altitude}&temp=${temp}`}
                className="mt-auto w-full flex items-center justify-center gap-3 py-4 rounded-xl text-[15px] font-semibold text-black transition-all duration-300 hover:scale-[1.01]"
                style={{ backgroundColor: accent }}
              >
                Recibir recomendación detallada de ingeniería
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-zinc-600 text-center mt-3 leading-relaxed">
                Datos preliminares de orientación. Un diagnóstico definitivo requiere evaluación en sitio por un especialista.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
