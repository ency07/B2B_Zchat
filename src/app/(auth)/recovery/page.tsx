"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/app/actions/auth";
import { Mail, ArrowRight, Check, AlertCircle } from "lucide-react";

export default function RecoveryPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);
    if (result.error) { setStatus("error"); setMessage(result.error); }
    else { setStatus("success"); setMessage(result.message || "Revisá tu correo."); }
  };

  return (
    <div>
      <h2 className="text-lg font-display font-bold text-white mb-1">Recuperar contraseña</h2>
      <p className="text-sm text-zinc-500 mb-6">Ingresá tu correo y te enviaremos instrucciones.</p>

      {status === "success" ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-emerald-400 block mb-1">Solicitud enviada</span>
            <p className="text-xs text-emerald-400/70">{message}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" /> {message}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input name="email" type="email" required placeholder="correo@empresa.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700/60 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all" />
            </div>
          </div>
          <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 active:scale-[0.98] transition-all">
            Enviar instrucciones <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-zinc-800/50 text-center">
        <Link href={`/login${tenantParam ? `?tenant=${tenantParam}` : ""}`} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
          ← Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
