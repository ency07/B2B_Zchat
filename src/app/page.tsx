import React from "react";
import { getTenantSettings } from "@/app/actions";
import { getIndustrialCatalog, CatalogCategory } from "@/app/actions/catalog";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSolutions from "@/components/landing/ProblemSolutions";
import EngineeringDiagnostic from "@/components/landing/EngineeringDiagnostic";
import SolutionCatalog from "@/components/landing/SolutionCatalog";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams: Promise<{ tenant?: string }>;
}): Promise<Metadata> {
  try {
    const searchParams = await props.searchParams;
    const tenant = searchParams.tenant || "acme";
    const branding = await getTenantSettings(tenant);
    const siteTitle =
      branding.titulo_navegador ||
      branding.nombre_comercial ||
      "Ingeniería de Ventilación Industrial";
    return {
      title: siteTitle,
      description:
        "Ingeniería especializada en ventilación industrial. Diagnosticamos tu problema antes de recomendarte nada. Extracción, inyección, balanceo y preingeniería automatizada.",
      icons: { icon: branding.favicon_url || "/favicon.ico" },
    };
  } catch {
    return {
      title: "Ingeniería de Ventilación Industrial",
      description:
        "Diagnóstico y soluciones de ventilación para plantas industriales.",
    };
  }
}

export default async function Home(props: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tenant = searchParams.tenant || "acme";

  let branding: Record<string, any> = {};
  try {
    branding = await getTenantSettings(tenant);
  } catch (error) {
    console.error("[Landing] Branding no disponible:", error);
  }

  let catalog: CatalogCategory[] = [];
  try {
    catalog = await getIndustrialCatalog(tenant);
  } catch (error) {
    console.error("[Landing] Catálogo no disponible:", error);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
      <Navbar branding={branding} />
      <HeroSection branding={branding} />
      <ProblemSolutions branding={branding} />
      <EngineeringDiagnostic branding={branding} />
      <SolutionCatalog
        catalog={catalog}
        branding={branding}
        tenantCode={tenant}
      />
      <ContactSection branding={branding} tenantCode={tenant} />
      <Footer branding={branding} />
    </div>
  );
}
