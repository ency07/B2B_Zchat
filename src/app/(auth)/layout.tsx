"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] bg-cyan-500/[0.03]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            {tenantParam === "apex" ? "Apex Logistics" : tenantParam === "ventitech" ? "VentiTech" : "AeroMax Industrial"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">ERP B2B Premium</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
          {children}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Acceso restringido a personal autorizado
        </p>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
          Cargando...
        </div>
      }
    >
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </React.Suspense>
  );
}
