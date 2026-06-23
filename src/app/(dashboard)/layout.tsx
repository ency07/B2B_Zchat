"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { LayoutProvider } from "@/components/layout-context";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useTheme } from "next-themes";
import { parseToHslChannels } from "@/utils/tenant";
import { BrandingConfig, getBrandingDefaults } from "@/utils/branding-defaults";
import { getTenantBranding } from "@/app/actions/branding";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const { resolvedTheme } = useTheme();

  // State to hold the active branding configuration
  const [activeConfig, setActiveConfig] = React.useState<BrandingConfig | null>(null);

  // 1. Load configuration from localStorage instantly (or fall back to defaults)
  React.useEffect(() => {
    const defaults = getBrandingDefaults(tenantParam);
    const cacheKey = `tenant_config_${tenantParam || "default"}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedObj = JSON.parse(cached);
        if (cachedObj.color_primario || cachedObj.nombre_comercial) {
          setActiveConfig({ ...defaults, ...cachedObj });
        } else if (cachedObj.primaryColor) {
          // Compatibility with old format
          setActiveConfig({
            ...defaults,
            nombre_comercial: cachedObj.name || defaults.nombre_comercial,
            color_primario: cachedObj.primaryColor.includes(' ') 
              ? `hsl(${cachedObj.primaryColor.replace(/\s+/g, ', ')})` 
              : cachedObj.primaryColor,
          });
        } else {
          setActiveConfig(defaults);
        }
      } catch (e) {
        setActiveConfig(defaults);
      }
    } else {
      setActiveConfig(defaults);
    }
  }, [tenantParam]);

  // 2. Perform background sync from Supabase to update the local configuration
  React.useEffect(() => {
    async function syncSettings() {
      try {
        const branding = await getTenantBranding(tenantParam);
        const cacheKey = `tenant_config_${tenantParam || "default"}`;
        const cachedStr = localStorage.getItem(cacheKey);
        
        // Update state and cache if different
        if (JSON.stringify(branding) !== cachedStr) {
          localStorage.setItem(cacheKey, JSON.stringify(branding));
          setActiveConfig(branding);
        }
      } catch (err) {
        console.error("Error syncing branding settings from Supabase:", err);
      }
    }
    syncSettings();
  }, [tenantParam]);

  // 3. Apply classes and custom style properties dynamically on DOM
  React.useEffect(() => {
    if (!activeConfig) return;
    const root = document.documentElement;
    
    // Theme selection based on tenant
    const theme = tenantParam === "apex" ? "dark" : (tenantParam === "acme" || tenantParam === "ventitech") ? "dark" : null;

    if (theme) {
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else {
      // Sync with global theme setting when default tenant
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [activeConfig, resolvedTheme, tenantParam]);

  return (
    <LayoutProvider>
      {/* Google Fonts Dynamic Loading */}
      {activeConfig && activeConfig.tipografia_principal && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${activeConfig.tipografia_principal.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`}
        />
      )}

      {/* Dynamic CSS override for White Label styling */}
      {activeConfig && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${parseToHslChannels(activeConfig.color_primario)} !important;
                --ring: ${parseToHslChannels(activeConfig.color_primario)} !important;
                --secondary: ${parseToHslChannels(activeConfig.color_secundario)} !important;
                --success: ${parseToHslChannels(activeConfig.color_exito)} !important;
                --warning: ${parseToHslChannels(activeConfig.color_warning)} !important;
                --destructive: ${parseToHslChannels(activeConfig.color_danger)} !important;
                --info: ${parseToHslChannels(activeConfig.color_info)} !important;
                --radius: ${activeConfig.border_radius === "ninguno" ? "0px" : activeConfig.border_radius === "sutil" ? "4px" : activeConfig.border_radius === "redondeado" ? "12px" : activeConfig.border_radius} !important;
                --font-sans: '${activeConfig.tipografia_principal}', var(--font-sans) !important;
              }
            `,
          }}
        />
      )}

      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
        <DashboardSidebar />
        <div className="flex-grow flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans">
          Cargando Dashboard...
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </React.Suspense>
  );
}
