"use server";

import { execute, queryOne } from "@/utils/db";
import { getTenantId } from "@/app/actions";

export interface RequirementRow {
  id: string; requirement_code: string; title: string; category: string;
  priority: string; status: string; client_id: string;
  engineering_user_id: string | null; sales_user_id: string | null; created_at: string;
  client: { legal_name: string; city: string | null } | null;
  engineering_user?: { first_name: string; last_name: string } | null;
}

export async function getRequirements(tenantCode?: string | null): Promise<RequirementRow[]> {
  const tenantId = await getTenantId(tenantCode ?? null);
  const rows = await execute<any>(
    `SELECT r.id, r.requirement_code, r.title, r.category, r.priority, r.status,
            r.client_id, r.engineering_user_id, r.sales_user_id, r.created_at,
            c.legal_name as client_name, c.city as client_city
     FROM requirements r
     LEFT JOIN clients c ON c.id = r.client_id AND c.deleted_at IS NULL
     WHERE r.tenant_id = $1 ORDER BY r.created_at DESC`, tenantId
  );
  return rows.map((r: any) => ({
    ...r,
    client: r.client_name ? { legal_name: r.client_name, city: r.client_city } : null,
    engineering_user: r.engineering_user_id ? { first_name: "Ing.", last_name: "Asignado" } : null
  }));
}

export async function createRequirement(tenantCode: string | null, reqData: { title: string; clientId: string; category: string; priority: string }) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";
  return queryOne(
    `INSERT INTO requirements (tenant_id, client_id, title, category, priority, status, created_by)
     VALUES ($1,$2,$3,$4,$5,'BORRADOR',$6) RETURNING *`,
    tenantId, reqData.clientId, reqData.title, reqData.category, reqData.priority, userId
  );
}

export async function updateRequirementStatus(reqId: string, newStatus: string, extra?: Record<string, any>) {
  const setClauses = [`status = '${newStatus}'`];
  if (extra) for (const [k, v] of Object.entries(extra)) setClauses.push(`${k} = '${v}'`);
  return queryOne(`UPDATE requirements SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`, reqId);
}
