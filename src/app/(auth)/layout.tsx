"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { getTenantConfig } from "@/utils/tenant";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const config = getTenantConfig(tenantParam);
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    const root = document.documentElement;
    if (config.theme) {
      if (config.theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.style.setProperty("--primary", config.primaryColor);
      root.style.setProperty("--ring", config.primaryColor);
    } else {
      // Sync with next-themes and clean up styling when default tenant is active
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
    }
  }, [config, resolvedTheme]);

  return (
    <>
      {/* Dynamic CSS override for White Label primary colors, only for specific tenants */}
      {config.theme && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${config.primaryColor} !important;
                --ring: ${config.primaryColor} !important;
              }
            `,
          }}
        />
      )}

      <div className="min-h-screen flex items-center justify-center p-4 bg-background transition-colors duration-300">
        <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-lg transition-all duration-300">
          <div className="flex flex-col text-center mb-6">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground transition-all duration-300">
              {config.name}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Portal de Acceso Autorizado
            </span>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans">
          Cargando Portal de Acceso...
        </div>
      }
    >
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </React.Suspense>
  );
}
