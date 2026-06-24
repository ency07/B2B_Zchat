"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, Check, Wind, User, Building2, Phone, Mail, 
  MapPin, AlertCircle, Gauge, Flame, Thermometer, Mountain
} from "lucide-react";
import { submitWizardData, WizardResult } from "@/app/actions/wizard";
import { calculateRequiredCfm } from "@/utils/engineering";

interface WizardStepperProps { branding: Record<string, any>; tenantCode: string; }

const COLOMBIAN_CITIES = [
  "Bogotá, D.C.", "Medellín, Antioquia", "Cali, Valle del Cauca", "Barranquilla, Atlántico",
  "Cartagena, Bolívar", "Bucaramanga, Santander", "Manizales, Caldas", "Pereira, Risaralda",
  "Yumbo, Valle del Cauca", "Itagüí, Antioquia", "Soledad, Atlántico",
];

const ENVIRONMENTS = [
  { id: "heavy_plant", label: "Planta pesada / Fundición", desc: "Alta carga térmica, polvo, gases" },
  { id: "mining", label: "Minería / Cemento", desc: "Partículas abrasivas, humedad" },
  { id: "warehouse", label: "Bodega / Almacén", desc: "Ventilación general" },
  { id: "data_center", label: "Data Center", desc: "Control térmico de precisión" },
  { id: "default", label: "Otro tipo de planta", desc: "Especificar en observaciones" },
];

const SERVICES = [
  { id: "fabricacion", label: "Fabricación de equipos", desc: "Diseño y construcción a medida" },
  { id: "venta", label: "Suministro industrial", desc: "Selección de equipos y componentes" },
  { id: "mantenimiento", label: "Mantenimiento preventivo", desc: "Inspección, balanceo, seguimiento" },
  { id: "reparacion", label: "Reparación en campo", desc: "Atención de fallas y daños" },
];

export default function WizardStepper({ branding, tenantCode }: WizardStepperProps) {
  const searchParams = useSearchParams();
  const accent = branding.color_primario || "#0ea5e9";
  const siteName = branding.nombre_comercial || "AeroMax Industrial";

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WizardResult | null>(null);

  const [form, setForm] = useState({
    servicio: "venta" as string,
    urgencia: "media" as string,
    length: 10, width: 8, height: 4,
    environment: "default" as string,
    nombre: "", empresa: "", cargo: "", cargoOtro: "",
    telefono: "", email: "", ciudad: "", observaciones: "",
  });

  const [realtimeCfm, setRealtimeCfm] = useState({ cfm: 0, cubicMeters: 0 });
  const [animatedCfm, setAnimatedCfm] = useState(0);

  // Pre-fill from URL params (landing diagnostic)
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    setForm(prev => ({
      ...prev,
      length: params.length ? Number(params.length) : prev.length,
      width: params.width ? Number(params.width) : prev.width,
      height: params.height ? Number(params.height) : prev.height,
      environment: params.environment || prev.environment,
    }));
  }, []);

  // Real-time CFM calculation (NO price — diagnostic only)
  useEffect(() => {
    const eng = calculateRequiredCfm(
      { length: Number(form.length), width: Number(form.width), height: Number(form.height) },
      form.environment as any
    );
    setRealtimeCfm({ cfm: eng.cfm, cubicMeters: eng.cubicMeters });
  }, [form.length, form.width, form.height, form.environment]);

  // Animated CFM counter
  useEffect(() => {
    const target = realtimeCfm.cfm;
    if (animatedCfm === target) return;
    const duration = 200, startTime = performance.now(), start = animatedCfm;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      setAnimatedCfm(Math.round(start + (target - start) * p * (2 - p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [realtimeCfm.cfm]);

  const handleChange = (key: string, val: any) => { setForm(p => ({ ...p, [key]: val })); };
  const totalSteps = 3;

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.servicio) e.servicio = "Seleccioná un servicio.";
    }
    if (s === 2) {
      if (Number(form.length) <= 0) e.length = "Requerido";
      if (Number(form.width) <= 0) e.width = "Requerido";
      if (Number(form.height) <= 0) e.height = "Requerido";
      if (!form.environment) e.environment = "Seleccioná el tipo de planta.";
    }
    if (s === 3) {
      if (!form.nombre.trim()) e.nombre = "Requerido";
      if (!form.empresa.trim()) e.empresa = "Requerido";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Correo válido requerido.";
      if (!form.telefono.trim()) e.telefono = "Requerido";
      if (!form.ciudad.trim()) e.ciudad = "Requerido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate(step)) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validate(3)) { setStep(3); return; }
    setIsSubmitting(true);
    try {
      const r = await submitWizardData(tenantCode, {
        servicio: form.servicio as any,
        length: Number(form.length), width: Number(form.width), height: Number(form.height),
        environment: form.environment as any,
        nombre: form.nombre, empresa: form.empresa,
        cargo: form.cargo === "otro" ? form.cargoOtro : form.cargo,
        telefono: form.telefono, email: form.email,
        ciudad: form.ciudad, urgencia: form.urgencia as any,
      });
      setResult(r);
    } catch {
      setErrors({ submit: "Error al enviar. Intentá de nuevo." });
    }
    setIsSubmitting(false);
  };

  // Success screen
  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800/60 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">Diagnóstico registrado</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Un ingeniero de {siteName} revisará tu caso y te responderá en menos de 72 horas
            con una recomendación técnica personalizada. Sin compromiso.
          </p>
          <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Código</span>
              <span className="text-white font-mono">{result.diagnosticCode}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Caudal requerido</span>
              <span className="text-white font-mono">{result.requiredCfm.toLocaleString()} CFM</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Volumen</span>
              <span className="text-white font-mono">{result.calculatedVolumeM3.toLocaleString()} m³</span>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-[0.15em] text-zinc-500 uppercase">{siteName}</span>
          <h1 className="text-2xl font-display font-bold text-white mt-2">Diagnóstico de ingeniería</h1>
          <p className="text-sm text-zinc-500 mt-1">Paso {step} de {totalSteps}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 px-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{ backgroundColor: i < step ? accent : "#27272a" }} />
          ))}
        </div>

        {/* HUD sidebar — diagnostic metrics only, NO price */}
        <div className="mb-6 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 flex flex-wrap items-center gap-6 justify-center">
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Caudal requerido</span>
            <span className="text-2xl font-display font-bold text-white font-mono">{animatedCfm.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-600 ml-1">CFM</span>
          </div>
          <div className="w-px h-10 bg-zinc-800 hidden sm:block" />
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Volumen</span>
            <span className="text-lg font-display font-bold text-white font-mono">{realtimeCfm.cubicMeters.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-600 ml-1">m³</span>
          </div>
          <div className="w-px h-10 bg-zinc-800 hidden sm:block" />
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 block mb-0.5">Dimensiones</span>
            <span className="text-sm font-bold text-white font-mono">{form.length}×{form.width}×{form.height}</span>
            <span className="text-[10px] text-zinc-600 ml-1">m</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 sm:p-8">
            
            {/* Step 1: Service type */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-display font-bold text-white">¿Qué servicio necesitás?</h2>
                <p className="text-sm text-zinc-400">Seleccioná el tipo de servicio para orientar el diagnóstico.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SERVICES.map(s => (
                    <button key={s.id} onClick={() => handleChange("servicio", s.id)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                        form.servicio === s.id ? "border-cyan-500/50 bg-cyan-500/5" : "border-zinc-800/60 hover:border-zinc-700"
                      }`}>
                      <span className="text-sm font-semibold text-white block mb-1">{s.label}</span>
                      <span className="text-xs text-zinc-500">{s.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.servicio && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.servicio}</p>}
              </div>
            )}

            {/* Step 2: Dimensions + Environment */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-display font-bold text-white">Dimensiones y condiciones de tu planta</h2>
                <p className="text-sm text-zinc-400">Los datos que ajustaste en la calculadora ya están cargados. Ajustalos si necesitás.</p>
                
                <div className="grid grid-cols-3 gap-4">
                  {[{ k: "length", l: "Largo (m)", min: 10, max: 150 }, { k: "width", l: "Ancho (m)", min: 5, max: 80 }, { k: "height", l: "Alto (m)", min: 3, max: 20 }].map(({ k, l, min, max }) => (
                    <div key={k}>
                      <label className="text-xs text-zinc-400 block mb-1">{l}</label>
                      <input type="number" min={min} max={max} value={(form as any)[k]}
                        onChange={e => handleChange(k, Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-2">Tipo de planta</label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {ENVIRONMENTS.map(env => (
                      <button key={env.id} onClick={() => handleChange("environment", env.id)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          form.environment === env.id ? "border-cyan-500/50 bg-cyan-500/5" : "border-zinc-800/60 hover:border-zinc-700"
                        }`}>
                        <span className="text-sm font-medium text-white block">{env.label}</span>
                        <span className="text-xs text-zinc-500">{env.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact info */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-display font-bold text-white">Tus datos de contacto</h2>
                <p className="text-sm text-zinc-400">Un ingeniero revisará tu caso y te contactará con una recomendación. Sin compromiso.</p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { k: "nombre", l: "Nombre completo", t: "text", icon: User },
                    { k: "empresa", l: "Empresa", t: "text", icon: Building2 },
                    { k: "email", l: "Correo electrónico", t: "email", icon: Mail },
                    { k: "telefono", l: "Teléfono", t: "tel", icon: Phone },
                  ].map(({ k, l, t, icon: Icon }) => (
                    <div key={k}>
                      <label className="text-xs text-zinc-400 block mb-1">{l}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input type={t} value={(form as any)[k]}
                          onChange={e => handleChange(k, e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/60 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
                      </div>
                      {errors[k] && <p className="text-xs text-red-400 mt-0.5">{errors[k]}</p>}
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Cargo</label>
                    <select value={form.cargo}
                      onChange={e => handleChange("cargo", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50">
                      <option value="">Seleccionar...</option>
                      <option value="Gerente de Mantenimiento">Gerente de Mantenimiento</option>
                      <option value="Director de Planta">Director de Planta</option>
                      <option value="Ingeniero de Proyectos">Ingeniero de Proyectos</option>
                      <option value="Supervisor de HVAC / Operaciones">Supervisor de Operaciones</option>
                      <option value="Compras / Abastecimiento">Compras / Abastecimiento</option>
                      <option value="otro">Otro (especificar)</option>
                    </select>
                    {form.cargo === "otro" && (
                      <input type="text" value={form.cargoOtro} onChange={e => handleChange("cargoOtro", e.target.value)}
                        placeholder="Especificá tu cargo" className="w-full mt-2 bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Ciudad de la planta</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input type="text" value={form.ciudad}
                        onChange={e => handleChange("ciudad", e.target.value)}
                        list="ciudades" placeholder="Ej: Medellín"
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/60 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50" />
                      <datalist id="ciudades">
                        {COLOMBIAN_CITIES.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    {errors.ciudad && <p className="text-xs text-red-400 mt-0.5">{errors.ciudad}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Observaciones adicionales (opcional)</label>
                  <textarea value={form.observaciones} onChange={e => handleChange("observaciones", e.target.value)}
                    rows={2} placeholder="Describí cualquier detalle relevante de tu planta o problema..."
                    className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none" />
                </div>
              </div>
            )}

            {/* Error */}
            {errors.submit && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{errors.submit}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800/60">
              <button onClick={handleBack} disabled={step === 1}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30">
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>

              {step < totalSteps ? (
                <button onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-black transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: accent }}>
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-black transition-all hover:scale-[1.01] disabled:opacity-50"
                  style={{ backgroundColor: accent }}>
                  {isSubmitting ? "Enviando..." : "Enviar diagnóstico"}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
