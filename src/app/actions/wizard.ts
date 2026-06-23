"use server";

import { execute, queryOne } from "@/utils/db";
import { getTenantId } from "@/app/actions";
import { calculateRequiredCfm } from "@/utils/engineering";
import { estimatePrice } from "@/utils/pricing";
import { createLeadWithScore } from "./leads";

export interface WizardSubmission {
  servicio: "fabricacion" | "venta" | "mantenimiento" | "reparacion";
  length: number; width: number; height: number;
  environment: "heavy_plant" | "data_center" | "mining" | "warehouse" | "default";
  nombre: string; empresa: string; cargo: string; telefono: string; email: string;
  ciudad: string; urgencia: "baja" | "media" | "alta";
}

export interface WizardResult {
  diagnosticCode: string; requiredCfm: number;
  cfmCategory: "CRITICAL" | "HIGH" | "STANDARD" | "COMPACT";
  calculatedVolumeM3: number;
  estimatedPriceMinCop: number; estimatedPriceMaxCop: number;
  estimatedPriceMinUsd: number; estimatedPriceMaxUsd: number;
  materialsRecommendation: string; leadId: string;
}

export async function submitWizardData(
  tenantCode: string | null, data: WizardSubmission
): Promise<WizardResult> {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

  const { cfm, cubicMeters } = calculateRequiredCfm(
    { length: data.length, width: data.width, height: data.height }, data.environment
  );
  const priceEstimation = estimatePrice(data.servicio, data.urgencia, cubicMeters);

  let cfmCategory: "CRITICAL" | "HIGH" | "STANDARD" | "COMPACT" = "STANDARD";
  if (cfm >= 15000) cfmCategory = "CRITICAL";
  else if (cfm >= 8000) cfmCategory = "HIGH";
  else if (cfm < 2000) cfmCategory = "COMPACT";

  let materialsRecommendation = "Extractor multiusos o axial de alta capacidad con ductería de acero galvanizado calibre 22.";
  if (data.environment === "heavy_plant" || data.environment === "mining") {
    materialsRecommendation = "Recomendado extractor industrial Blower o tipo Hongo con recubrimiento epóxico anticorrosivo y álabes de aluminio extruido.";
  } else if (data.environment === "data_center") {
    materialsRecommendation = "Recomendado sistema de inyección de aire con filtros de partículas EPA/HEPA y control acústico de baja vibración.";
  }

  // Find or create client
  let client = await queryOne<{ id: string }>(
    "SELECT id FROM clients WHERE tenant_id = $1 AND legal_name = $2 AND deleted_at IS NULL LIMIT 1",
    tenantId, data.empresa
  );

  if (!client) {
    client = await queryOne<{ id: string }>(
      `INSERT INTO clients (tenant_id, legal_name, client_type, country, city, phone, email, assigned_user_id, status, created_by)
       VALUES ($1,$2,'Empresa','Colombia',$3,$4,$5,$6,'PROSPECTO',$7) RETURNING id`,
      tenantId, data.empresa, data.ciudad, data.telefono, data.email, userId, userId
    );
  }
  if (!client) throw new Error("No se pudo obtener o crear el cliente.");
  const clientId = client.id;

  // Find or create contact
  let contact = await queryOne<{ id: string }>(
    "SELECT id FROM client_contacts WHERE tenant_id = $1 AND client_id = $2 AND email = $3 AND deleted_at IS NULL LIMIT 1",
    tenantId, clientId, data.email
  );

  if (!contact) {
    contact = await queryOne<{ id: string }>(
      `INSERT INTO client_contacts (tenant_id, client_id, first_name, last_name, position, email, phone, created_by)
       VALUES ($1,$2,$3,'',$4,$5,$6,$7) RETURNING id`,
      tenantId, clientId, data.nombre, data.cargo, data.email, data.telefono, userId
    );
  }
  if (!contact) throw new Error("No se pudo obtener o crear el contacto.");
  const contactId = contact.id;

  // Create lead with scoring
  const lead = await createLeadWithScore(tenantCode, {
    clientId, contactId,
    notes: `Cálculo CFM: ${cfm}. Volumen M3: ${cubicMeters}. Urgencia: ${data.urgencia}. Ciudad: ${data.ciudad}.`,
    role: data.cargo, urgency: data.urgencia, email: data.email
  });

  // Create diagnostic report
  const diagReport = await queryOne<any>(
    `INSERT INTO diagnostic_reports (tenant_id, lead_id, service_type, dimensions, symptoms, calculated_volume, calculated_cfm, cfm_category, materials_recommendation, estimated_price_min_cop, estimated_price_max_cop, estimated_price_min_usd, estimated_price_max_usd, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING diagnostic_code`,
    tenantId, lead.id, data.servicio,
    JSON.stringify({ length: data.length, width: data.width, height: data.height }),
    JSON.stringify({ environment: data.environment, city: data.ciudad }),
    cubicMeters, cfm, cfmCategory, materialsRecommendation,
    priceEstimation.rangeMinCop, priceEstimation.rangeMaxCop,
    priceEstimation.rangeMinUsd, priceEstimation.rangeMaxUsd,
    userId
  );

  return {
    diagnosticCode: diagReport?.diagnostic_code || "DIAG-000",
    requiredCfm: cfm, cfmCategory, calculatedVolumeM3: cubicMeters,
    estimatedPriceMinCop: priceEstimation.rangeMinCop, estimatedPriceMaxCop: priceEstimation.rangeMaxCop,
    estimatedPriceMinUsd: priceEstimation.rangeMinUsd, estimatedPriceMaxUsd: priceEstimation.rangeMaxUsd,
    materialsRecommendation, leadId: lead.id,
  };
}
