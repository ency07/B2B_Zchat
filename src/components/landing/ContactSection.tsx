"use client";

import React, { useState, useTransition } from "react";
import { submitContactForm } from "@/app/actions/leads";
import { Send, Check, AlertCircle, Phone, Mail, MapPin, Clock, Shield } from "lucide-react";

interface ContactSectionProps {
  branding: Record<string, any>;
  tenantCode: string;
}

export default function ContactSection({ branding, tenantCode }: ContactSectionProps) {
  const accent = branding.color_primario || "#0ea5e9";
  const [form, setForm] = useState({
    name: "", company: "", phone: "", email: "", problem: "", urgency: "media",
  });
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitContactForm(tenantCode, {
          name: form.name,
          companyName: form.company,
          phone: form.phone,
          email: form.email,
          urgency: form.urgency,
          description: form.problem,
        });
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  };

  return (
    <section id="contacto" className="relative bg-zinc-900 py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-5 gap-16">
          {/* Left column — info */}
          <div className="lg:col-span-2">
            <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 block">
              Contacto
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-[1.1] mb-6">
              Describinos tu problema de ventilación
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-10">
              Un ingeniero especializado analiza tu caso sin costo y te responde
              en menos de 72 horas con una recomendación técnica. Sin letra chica,
              sin llamadas no solicitadas.
            </p>

            {/* Contact details */}
            <div className="space-y-5 mb-10">
              {[
                { icon: Phone, label: "Teléfono", value: "+57 300 000 0000" },
                { icon: Mail, label: "Correo", value: "ingenieria@aeromaxindustrial.com" },
                { icon: MapPin, label: "Planta", value: "Zona Industrial, Colombia" },
                { icon: Clock, label: "Horario", value: "Lunes a viernes 7am–6pm · Sábados 7am–12pm" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/30 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-600 block">{label}</span>
                    <span className="text-sm text-zinc-300">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust note */}
            <div className="flex items-start gap-3 p-4 border border-zinc-800/50 rounded-xl bg-zinc-950/30">
              <Shield className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                No compartimos tu información con terceros. No recibirás llamadas
                comerciales. Tu caso queda registrado y podés consultar su estado.
              </p>
            </div>
          </div>

          {/* Right column — form */}
          <div className="lg:col-span-3">
            {status === "success" ? (
              <div className="bg-zinc-950/60 border border-emerald-500/15 rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-3">
                  Caso registrado
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                  Recibimos tu información. Un ingeniero de ventilación industrial
                  la revisa y te responde con un diagnóstico preliminar en menos de 72 horas.
                  Si es urgente, llamanos.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: "name", label: "Nombre completo", placeholder: "Tu nombre", type: "text" },
                    { key: "company", label: "Empresa", placeholder: "Nombre de tu empresa", type: "text" },
                    { key: "phone", label: "Teléfono", placeholder: "+57 3XX XXX XXXX", type: "tel" },
                    { key: "email", label: "Correo electrónico", placeholder: "correo@empresa.com", type: "email" },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="text-[11px] text-zinc-500 block mb-1.5">
                        {label}
                      </label>
                      <input
                        required
                        type={type}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] text-zinc-500 block mb-1.5">
                    Describí tu problema
                    <span className="text-zinc-700 ml-1">— cuanto más específico, mejor diagnóstico</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.problem}
                    onChange={(e) => setForm({ ...form, problem: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                    placeholder="Ej: Nave de 30×15m con soldadura. En verano llega a 48°C interior. Los operarios solo rinden media jornada. Necesito extracción que no supere 70 dBA porque hay oficinas cerca."
                  />
                </div>

                {/* Urgency */}
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-2">Urgencia del proyecto</label>
                  <div className="flex gap-2">
                    {[
                      { value: "alta", label: "Urgente – esta semana" },
                      { value: "media", label: "Este mes" },
                      { value: "baja", label: "Proyecto a futuro" },
                    ].map(({ value, label }) => (
                      <label
                        key={value}
                        className={`text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all border ${
                          form.urgency === value
                            ? "text-white bg-zinc-800 border-zinc-600"
                            : "text-zinc-500 bg-transparent border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="urgency"
                          value={value}
                          checked={form.urgency === value}
                          onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[15px] font-semibold text-black transition-all duration-300 hover:scale-[1.01] disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {isPending ? (
                    "Enviando caso..."
                  ) : (
                    <>
                      Enviar para diagnóstico técnico
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    No se pudo enviar. Intentá de nuevo o llamanos directamente.
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
