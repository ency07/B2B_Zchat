"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/app/actions/auth";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.redirect) {
        router.push(tenantParam ? `${result.redirect}?tenant=${tenantParam}` : result.redirect);
      } else {
        setError("Error inesperado. Intentá de nuevo.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error de conexión. Verificá tu conexión e intentá de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-display font-bold text-white mb-1">Iniciar sesión</h2>
      <p className="text-sm text-zinc-500 mb-6">Ingresá tus credenciales para acceder al sistema.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              name="email"
              type="email"
              required
              placeholder="nombre@empresa.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700/60 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-400">Contraseña</label>
            <Link
              href={`/recovery${tenantParam ? `?tenant=${tenantParam}` : ""}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700/60 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Iniciar sesión <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-zinc-800/50 text-center">
        <p className="text-xs text-zinc-600">
          ¿No tenés cuenta?{" "}
          <Link
            href={`/register${tenantParam ? `?tenant=${tenantParam}` : ""}`}
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Crear cuenta gratuita
          </Link>
        </p>
      </div>
    </div>
  );
}
