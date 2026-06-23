"use server";

import { execute, queryOne } from "@/utils/db";
import { getTenantId } from "@/app/actions";

export interface QuoteRow {
  id: string; quote_code: string; client_id: string; requirement_id: string | null;
  assigned_user_id: string | null; valid_until: string; subtotal: number; total_amount: number;
  status: string; created_at: string; client: { legal_name: string } | null;
}

export async function getQuotes(tenantCode?: string | null): Promise<QuoteRow[]> {
  const tenantId = await getTenantId(tenantCode ?? null);
  const rows = await execute<any>(
    `SELECT q.id, q.quote_code, q.client_id, q.requirement_id, q.assigned_user_id,
            q.valid_until, q.subtotal, q.total_amount, q.status, q.created_at,
            c.legal_name as client_name
     FROM quotes q LEFT JOIN clients c ON c.id = q.client_id AND c.deleted_at IS NULL
     WHERE q.tenant_id = $1 ORDER BY q.created_at DESC`, tenantId
  );
  return rows.map((r: any) => ({
    ...r, client: r.client_name ? { legal_name: r.client_name } : null
  }));
}

export async function createQuote(tenantCode: string | null, quoteData: { clientId: string; requirementId?: string; validUntil: string }) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";
  return queryOne(
    `INSERT INTO quotes (tenant_id, client_id, requirement_id, assigned_user_id, valid_until, status, created_by)
     VALUES ($1,$2,$3,$4,$5,'BORRADOR',$6) RETURNING *`,
    tenantId, quoteData.clientId, quoteData.requirementId || null, userId, quoteData.validUntil, userId
  );
}

export async function getQuoteItems(quoteId: string) {
  return execute("SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY item_order", quoteId);
}

export async function addQuoteItem(tenantCode: string | null, itemData: { quoteId: string; description: string; itemType: string; quantity: number; unitPrice: number; discountAmount: number; taxPercent: number; itemOrder: number }) {
  const tenantId = await getTenantId(tenantCode);
  return queryOne(
    `INSERT INTO quote_items (tenant_id, quote_id, item_order, item_type, description, quantity, unit, unit_price, discount_amount, tax_percent)
     VALUES ($1,$2,$3,$4,$5,$6,'UNIDAD',$7,$8,$9) RETURNING *`,
    tenantId, itemData.quoteId, itemData.itemOrder, itemData.itemType, itemData.description, itemData.quantity, itemData.unitPrice, itemData.discountAmount, itemData.taxPercent
  );
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  return queryOne("UPDATE quotes SET status = $1 WHERE id = $2 RETURNING *", status, quoteId);
}
