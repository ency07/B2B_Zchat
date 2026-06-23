"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { register } from "@/app/actions/auth";
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await register(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result.redirect) {
      router.push(tenantParam ? `${result.redirect}?tenant=${tenantParam}` : result.redirect);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-display font-bold text-white mb-1">Crear cuenta</h2>
      <p className="text-sm text-zinc-500 mb-6">Comenzá gratis. Sin tarjeta de crédito.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">Nombre completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input name="name" type="text" required placeholder="Tu nombre" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700/60 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">Empresa</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input name="company" type="text" required placeholder="Tu empresa" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700/60 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input name="email" type="email" required placeholder="correo@empresa.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700/60 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input name="password" type={showPassword ? "text" : "password"} required minLength={8} placeholder="Mínimo 8 caracteres" className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700/60 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 active:scale-[0.98] transition-all disabled:opacity-50">
          {isLoading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <>Crear cuenta gratuita <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-zinc-800/50 text-center">
        <p className="text-xs text-zinc-600">
          ¿Ya tenés cuenta?{" "}
          <Link href={`/login${tenantParam ? `?tenant=${tenantParam}` : ""}`} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
