"use server";

import { supabaseAdmin } from "@/utils/supabase";
import { getTenantId } from "@/app/actions";

export interface LeadScoreResult {
  score: number;
  riskLevel: "CALIENTE" | "TIBIO" | "FRIO" | "SPAM";
}

const PUBLIC_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com"];

/**
 * Calcula el puntaje de prioridad (scoring) y clasifica el lead en español.
 */
export async function calculateLeadScore(
  email: string,
  role: string,
  urgency: string
): Promise<LeadScoreResult> {
  let score = 0;

  // 1. Clasificación por Cargo Profesional
  if (
    ["Director de Planta", "Gerente de Mantenimiento", "Supervisor de HVAC / Operaciones"].includes(
      role
    )
  ) {
    score += 40;
  } else if (["Ingeniero de Proyectos", "Compras / Abastecimiento"].includes(role)) {
    score += 25;
  } else {
    score += 10;
  }

  // 2. Clasificación por Urgencia del Requerimiento
  if (urgency === "alta") {
    score += 40;
  } else if (urgency === "media") {
    score += 20;
  } else {
    score += 5;
  }

  // 3. Penalización por Dominios de Correo Públicos (No Corporativos)
  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  const isPublicDomain = PUBLIC_DOMAINS.includes(emailDomain);
  
  if (isPublicDomain) {
    score -= 20; // Penalización de 20 puntos por no usar correo corporativo
  }

  // Asegurar límites del score
  score = Math.max(0, Math.min(100, score));

  // 4. Asignación de nivel de riesgo/prioridad en Español (CALIENTE, TIBIO, FRIO, SPAM)
  let riskLevel: "CALIENTE" | "TIBIO" | "FRIO" | "SPAM" = "FRIO";

  // Detección directa de SPAM (correos temporales o sospechosos)
  const isDisposable = ["yopmail.com", "mailinator.com", "tempmail.com"].includes(emailDomain);
  if (isDisposable || email.length < 5 || !email.includes("@")) {
    riskLevel = "SPAM";
    score = 0;
  } else if (score >= 70) {
    riskLevel = "CALIENTE";
  } else if (score >= 40) {
    riskLevel = "TIBIO";
  } else {
    riskLevel = "FRIO";
  }

  return { score, riskLevel };
}

/**
 * Registra un Lead con su score calculado en el sistema.
 */
export async function createLeadWithScore(
  tenantCode: string | null,
  leadData: {
    clientId: string;
    contactId: string;
    notes?: string;
    role: string;
    urgency: string;
    email: string;
  }
) {
  const tenantId = await getTenantId(tenantCode);
  const { score, riskLevel } = await calculateLeadScore(leadData.email, leadData.role, leadData.urgency);

  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";

  // Insertar lead en la tabla leads
  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      tenant_id: tenantId,
      client_id: leadData.clientId,
      contact_id: leadData.contactId,
      lead_source: "WEBSITE", // Fuente de cotizador web
      score,
      risk_level: riskLevel, // Estados en español: CALIENTE, TIBIO, FRIO, SPAM
      notes: leadData.notes || `Contacto registrado vía Wizard Web. Rol: ${leadData.role}. Urgencia: ${leadData.urgency}.`,
      status: "NUEVO",
      assigned_user_id: userId,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating lead with score:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Registra un Lead proveniente del formulario de contacto B2B de la landing.
 */
export async function submitContactForm(
  tenantCode: string | null,
  leadData: {
    name: string;
    companyName: string;
    phone: string;
    email: string;
    urgency: string;
    description: string;
  }
) {
  const tenantId = await getTenantId(tenantCode);
  const { score, riskLevel } = await calculateLeadScore(leadData.email, "Otro", leadData.urgency);

  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      tenant_id: tenantId,
      name: leadData.name,
      company_name: leadData.companyName,
      phone: leadData.phone,
      email: leadData.email,
      urgency: leadData.urgency,
      score,
      lead_score: score,
      risk_level: riskLevel,
      notes: leadData.description,
      lead_source: "WEBSITE",
      status: "NUEVO",
      assigned_user_id: userId,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting contact lead:", error);
    throw new Error(error.message);
  }

  return data;
}

