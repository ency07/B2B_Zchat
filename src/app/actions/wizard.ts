"use server";

import { supabaseAdmin } from "@/utils/supabase";
import { getTenantId } from "@/app/actions";
import { calculateRequiredCfm } from "@/utils/engineering";
import { estimatePrice } from "@/utils/pricing";
import { createLeadWithScore } from "./leads";

export interface WizardSubmission {
  servicio: "fabricacion" | "venta" | "mantenimiento" | "reparacion";
  length: number;
  width: number;
  height: number;
  environment: "heavy_plant" | "data_center" | "mining" | "warehouse" | "default";
  nombre: string;
  empresa: string;
  cargo: string;
  telefono: string;
  email: string;
  ciudad: string;
  urgencia: "baja" | "media" | "alta";
}

export interface WizardResult {
  diagnosticCode: string;
  requiredCfm: number;
  cfmCategory: "CRITICAL" | "HIGH" | "STANDARD" | "COMPACT";
  calculatedVolumeM3: number;
  estimatedPriceMinCop: number;
  estimatedPriceMaxCop: number;
  estimatedPriceMinUsd: number;
  estimatedPriceMaxUsd: number;
  materialsRecommendation: string;
  leadId: string;
}

/**
 * Procesa la sumisión del Wizard Web:
 * 1. Calcula CFM y estimación de precios con los Motores funcionales.
 * 2. Registra o Reutiliza al Cliente (en clients) y Contacto (en client_contacts).
 * 3. Crea el Requerimiento (requirements) y el Lead (leads) con score dinámico en español.
 * 4. Guarda el Reporte de Diagnóstico (diagnostic_reports).
 */
export async function submitWizardData(
  tenantCode: string | null,
  data: WizardSubmission
): Promise<WizardResult> {
  const tenantId = await getTenantId(tenantCode);

  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";

  // 1. Cálculos de Motores Funcionales
  const { cfm, cubicMeters } = calculateRequiredCfm(
    { length: data.length, width: data.width, height: data.height },
    data.environment
  );

  const priceEstimation = estimatePrice(data.servicio, data.urgencia, cubicMeters);

  // Clasificación de Caudal
  let cfmCategory: "CRITICAL" | "HIGH" | "STANDARD" | "COMPACT" = "STANDARD";
  if (cfm >= 15000) {
    cfmCategory = "CRITICAL";
  } else if (cfm >= 8000) {
    cfmCategory = "HIGH";
  } else if (cfm < 2000) {
    cfmCategory = "COMPACT";
  }

  // Recomendación de materiales dinámica
  let materialsRecommendation = "Extractor multiusos o axial de alta capacidad con ductería de acero galvanizado calibre 22.";
  if (data.environment === "heavy_plant" || data.environment === "mining") {
    materialsRecommendation = "Recomendado extractor industrial Blower o tipo Hongo con recubrimiento epóxico anticorrosivo y álabes de aluminio extruido.";
  } else if (data.environment === "data_center") {
    materialsRecommendation = "Recomendado sistema de inyección de aire con filtros de partículas EPA/HEPA y control acústico de baja vibración.";
  }

  // 2. Reutilización B2B Upsert (Clients)
  // Buscar si ya existe el cliente por Razón Social (legal_name)
  let { data: client } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("legal_name", data.empresa)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!client) {
    // Si no existe, crear nuevo cliente (tax_id es nullable)
    const { data: newClient, error: clientErr } = await supabaseAdmin
      .from("clients")
      .insert({
        tenant_id: tenantId,
        legal_name: data.empresa,
        client_type: "Empresa",
        country: "Colombia",
        city: data.ciudad,
        phone: data.telefono,
        email: data.email,
        assigned_user_id: userId,
        status: "PROSPECTO",
        created_by: userId
      })
      .select()
      .single();

    if (clientErr) {
      console.error("Error creating client in wizard:", clientErr);
      throw new Error(clientErr.message);
    }
    client = newClient;
  }

  if (!client) {
    throw new Error("No se pudo obtener o crear el cliente.");
  }

  const clientId = client.id;

  // 3. Reutilización de Contactos (client_contacts)
  let { data: contact } = await supabaseAdmin
    .from("client_contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("email", data.email)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!contact) {
    // Crear el contacto
    const { data: newContact, error: contactErr } = await supabaseAdmin
      .from("client_contacts")
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        first_name: data.nombre,
        last_name: "",
        position: data.cargo,
        email: data.email,
        phone: data.telefono,
        created_by: userId
      })
      .select()
      .single();

    if (contactErr) {
      console.error("Error creating contact in wizard:", contactErr);
      throw new Error(contactErr.message);
    }
    contact = newContact;
  }

  if (!contact) {
    throw new Error("No se pudo obtener o crear el contacto.");
  }

  const contactId = contact.id;

  // 4. Registrar Lead Calificado con Scoring en Español
  const leadNotes = `Cálculo CFM: ${cfm}. Volumen M3: ${cubicMeters}. Urgencia: ${data.urgencia}. Ciudad: ${data.ciudad}.`;
  const lead = await createLeadWithScore(tenantCode, {
    clientId,
    contactId,
    notes: leadNotes,
    role: data.cargo,
    urgency: data.urgencia,
    email: data.email
  });

  // 5. Registrar Reporte de Diagnóstico (diagnostic_reports)
  const { data: diagReport, error: diagErr } = await supabaseAdmin
    .from("diagnostic_reports")
    .insert({
      tenant_id: tenantId,
      lead_id: lead.id,
      service_type: data.servicio,
      dimensions: {
        length: data.length,
        width: data.width,
        height: data.height
      },
      symptoms: {
        environment: data.environment,
        city: data.ciudad
      },
      calculated_volume: cubicMeters,
      calculated_cfm: cfm,
      cfm_category: cfmCategory,
      materials_recommendation: materialsRecommendation,
      estimated_price_min_cop: priceEstimation.rangeMinCop,
      estimated_price_max_cop: priceEstimation.rangeMaxCop,
      estimated_price_min_usd: priceEstimation.rangeMinUsd,
      estimated_price_max_usd: priceEstimation.rangeMaxUsd,
      created_by: userId
    })
    .select()
    .single();

  if (diagErr) {
    console.error("Error creating diagnostic report:", diagErr);
    throw new Error(diagErr.message);
  }

  return {
    diagnosticCode: diagReport.diagnostic_code,
    requiredCfm: cfm,
    cfmCategory,
    calculatedVolumeM3: cubicMeters,
    estimatedPriceMinCop: priceEstimation.rangeMinCop,
    estimatedPriceMaxCop: priceEstimation.rangeMaxCop,
    estimatedPriceMinUsd: priceEstimation.rangeMinUsd,
    estimatedPriceMaxUsd: priceEstimation.rangeMaxUsd,
    materialsRecommendation,
    leadId: lead.id
  };
}
