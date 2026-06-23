"use server";

import { execute, queryOne } from "@/utils/db";
import { getTenantId } from "@/app/actions";

export interface LeadScoreResult {
  score: number;
  riskLevel: "CALIENTE" | "TIBIO" | "FRIO" | "SPAM";
}

const PUBLIC_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "icloud.com"];

export async function calculateLeadScore(email: string, role: string, urgency: string): Promise<LeadScoreResult> {
  let score = 0;

  if (["Director de Planta", "Gerente de Mantenimiento", "Supervisor de HVAC / Operaciones"].includes(role)) {
    score += 40;
  } else if (["Ingeniero de Proyectos", "Compras / Abastecimiento"].includes(role)) {
    score += 25;
  } else {
    score += 10;
  }

  if (urgency === "alta") score += 40;
  else if (urgency === "media") score += 20;
  else score += 5;

  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  if (PUBLIC_DOMAINS.includes(emailDomain)) score -= 20;

  score = Math.max(0, Math.min(100, score));

  let riskLevel: "CALIENTE" | "TIBIO" | "FRIO" | "SPAM" = "FRIO";
  const isDisposable = ["yopmail.com", "mailinator.com", "tempmail.com"].includes(emailDomain);

  if (isDisposable || email.length < 5 || !email.includes("@")) {
    riskLevel = "SPAM"; score = 0;
  } else if (score >= 70) riskLevel = "CALIENTE";
  else if (score >= 40) riskLevel = "TIBIO";

  return { score, riskLevel };
}

export async function createLeadWithScore(
  tenantCode: string | null,
  leadData: { clientId: string; contactId: string; notes?: string; role: string; urgency: string; email: string }
) {
  const tenantId = await getTenantId(tenantCode);
  const { score, riskLevel } = await calculateLeadScore(leadData.email, leadData.role, leadData.urgency);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

  const row = await queryOne<any>(
    `INSERT INTO leads (tenant_id, client_id, contact_id, lead_source, score, lead_score, risk_level, notes, status, assigned_user_id, created_by)
     VALUES ($1,$2,$3,'WEBSITE',$4,$5,$6,$7,'NUEVO',$8,$9) RETURNING *`,
    tenantId, leadData.clientId, leadData.contactId, score, score, riskLevel,
    leadData.notes || `Contacto vía Wizard Web. Rol: ${leadData.role}. Urgencia: ${leadData.urgency}.`,
    userId, userId
  );
  return row;
}

export async function submitContactForm(
  tenantCode: string | null,
  leadData: { name: string; companyName: string; phone: string; email: string; urgency: string; description: string }
) {
  const tenantId = await getTenantId(tenantCode);
  const { score, riskLevel } = await calculateLeadScore(leadData.email, "Otro", leadData.urgency);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

  const row = await queryOne(
    `INSERT INTO leads (tenant_id, name, company_name, phone, email, urgency, score, lead_score, risk_level, notes, lead_source, status, assigned_user_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'WEBSITE','NUEVO',$11,$12) RETURNING *`,
    tenantId, leadData.name, leadData.companyName, leadData.phone, leadData.email,
    leadData.urgency, score, score, riskLevel, leadData.description, userId, userId
  );
  return row;
}
