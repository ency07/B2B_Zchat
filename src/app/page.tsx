import React from "react";
import { getTenantSettings } from "@/app/actions";
import { getIndustrialCatalog, CatalogCategory } from "@/app/actions/catalog";
import CatalogView from "@/components/CatalogView";
import { Metadata } from "next";

// Forzar revalidación dinámica
export const dynamic = "force-dynamic";

export async function generateMetadata(props: { searchParams: Promise<{ tenant?: string }> }): Promise<Metadata> {
  try {
    const searchParams = await props.searchParams;
    const tenant = searchParams.tenant || "acme";
    const branding = await getTenantSettings(tenant);
    const siteTitle = branding.titulo_navegador || branding.nombre_comercial || "Sistemas de Ventilación Industrial";
    const favicon = branding.favicon_url || "/favicon.ico";
    return {
      title: siteTitle,
      description: "Diseño, fabricación y mantenimiento de turbomaquinaria industrial. Extracción, inyección, balanceo y preingeniería automatizada.",
      icons: {
        icon: favicon,
      }
    };
  } catch {
    return {
      title: "Sistemas de Ventilación Industrial",
      description: "Diseño, fabricación y mantenimiento de turbomaquinaria industrial.",
    };
  }
}


export default async function Home(props: { searchParams: Promise<{ tenant?: string }> }) {
  const searchParams = await props.searchParams;
  const tenant = searchParams.tenant || "acme";

  // Branding: no crítico — usa defaults si falla
  let branding = {};
  try {
    branding = await getTenantSettings(tenant);
  } catch (error) {
    console.error("[Landing] Branding no disponible, usando defaults:", error);
  }

  // Catálogo: crítico — si falla, Next.js muestra error.tsx con botón Reintentar
  const catalog: CatalogCategory[] = await getIndustrialCatalog(tenant);

  return (
    <main className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <CatalogView catalog={catalog} branding={branding} tenantCode={tenant} />
    </main>
  );
}


