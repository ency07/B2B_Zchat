"use server";

import { execute } from "@/utils/db";
import { getTenantId } from "@/app/actions";

export interface LeadRow {
  id: string; lead_code: string; risk_level: string; score: number; status: string;
  lead_source: string | null; notes: string | null; created_at: string; assigned_user_id: string | null;
  client: { legal_name: string; city: string | null } | null;
  contact: { first_name: string; last_name: string; email: string | null; phone: string | null } | null;
  diagnostic: any | null;
}

export async function getLeads(tenantCode?: string | null): Promise<LeadRow[]> {
  const tenantId = await getTenantId(tenantCode ?? null);

  const rows = await execute<any>(
    `SELECT l.id, l.lead_code, l.risk_level, l.score, l.status, l.lead_source,
            l.notes, l.created_at, l.assigned_user_id,
            c.legal_name as client_legal_name, c.city as client_city,
            co.first_name as contact_first_name, co.last_name as contact_last_name,
            co.email as contact_email, co.phone as contact_phone,
            dr.id as diag_id, dr.diagnostic_code, dr.service_type, dr.calculated_cfm,
            dr.cfm_category, dr.estimated_price_min_cop, dr.estimated_price_max_cop,
            dr.materials_recommendation, dr.dimensions, dr.calculated_volume
     FROM leads l
     LEFT JOIN clients c ON c.id = l.client_id AND c.deleted_at IS NULL
     LEFT JOIN client_contacts co ON co.id = l.contact_id AND co.deleted_at IS NULL
     LEFT JOIN diagnostic_reports dr ON dr.lead_id = l.id
     WHERE l.tenant_id = $1 AND l.deleted_at IS NULL
     ORDER BY l.created_at DESC LIMIT 200`,
    tenantId
  );

  return rows.map((row: any) => ({
    id: row.id,
    lead_code: row.lead_code,
    risk_level: row.risk_level,
    score: row.score,
    status: row.status,
    lead_source: row.lead_source,
    notes: row.notes,
    created_at: row.created_at,
    assigned_user_id: row.assigned_user_id,
    client: row.client_legal_name ? { legal_name: row.client_legal_name, city: row.client_city } : null,
    contact: row.contact_first_name ? {
      first_name: row.contact_first_name,
      last_name: row.contact_last_name || "",
      email: row.contact_email,
      phone: row.contact_phone
    } : null,
    diagnostic: row.diag_id ? {
      id: row.diag_id,
      diagnostic_code: row.diagnostic_code,
      service_type: row.service_type,
      calculated_cfm: row.calculated_cfm,
      cfm_category: row.cfm_category,
      estimated_price_min_cop: row.estimated_price_min_cop || 0,
      estimated_price_max_cop: row.estimated_price_max_cop || 0,
      materials_recommendation: row.materials_recommendation,
      dimensions: row.dimensions,
      calculated_volume: row.calculated_volume,
    } : null,
  }));
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: "NUEVO" | "EN_SEGUIMIENTO" | "CALIFICADO" | "RECHAZADO" | "CONVERTIDO"
): Promise<void> {
  await execute(
    "UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2",
    newStatus, leadId
  );
}
