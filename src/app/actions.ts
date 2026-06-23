"use server";

import { queryOne, execute } from "@/utils/db";

// ==========================================
// Tenant helpers
// ==========================================

export async function getTenantId(tenantCode?: string | null): Promise<string> {
  if (tenantCode === "apex") {
    return "b0000000-0000-0000-0000-000000000000";
  }
  // Try to resolve by slug
  if (tenantCode && tenantCode !== "acme") {
    const row = await queryOne<{ id: string }>(
      "SELECT id FROM tenants WHERE slug = $1 AND deleted_at IS NULL LIMIT 1",
      tenantCode
    );
    if (row) return row.id;
  }
  return "a0000000-0000-0000-0000-000000000000"; // default acme
}

// ==========================================
// CLIENTS
// ==========================================

export async function getClients(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);

  const rows = await execute<{
    id: string; tax_id: string; legal_name: string; industry: string; status: string;
  }>(
    `SELECT id, tax_id, legal_name, industry, status
     FROM clients
     WHERE tenant_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    tenantId
  );

  const result = [];
  for (const client of rows) {
    const invoices = await execute<{ total_amount: number }>(
      `SELECT total_amount FROM invoices
       WHERE client_id = $1 AND deleted_at IS NULL
       AND status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA')`,
      client.id
    );
    const total = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    result.push({
      id: client.id,
      taxId: client.tax_id,
      name: client.legal_name,
      segment: client.industry || "General",
      totalInvoiced: total,
      status: (client.status === "ACTIVO" ? "ACTIVO"
        : client.status === "INACTIVO" ? "SUSPENDIDO"
        : "PENDIENTE") as "ACTIVO" | "SUSPENDIDO" | "PENDIENTE",
    });
  }

  return result;
}

export async function createClient(
  tenantCode: string | null,
  clientData: { taxId: string; name: string; segment: string; email: string }
) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

  const existing = await queryOne("SELECT id FROM clients WHERE tenant_id = $1 AND tax_id = $2 AND deleted_at IS NULL LIMIT 1", tenantId, clientData.taxId);
  if (existing) throw new Error("Ya existe un cliente con este RFC para este tenant.");

  const row = await queryOne<{ id: string; tax_id: string; legal_name: string }>(
    `INSERT INTO clients (tenant_id, tax_id, legal_name, industry, email, client_type, country, assigned_user_id, status)
     VALUES ($1, $2, $3, $4, $5, 'Empresa', 'Colombia', $6, 'ACTIVO')
     RETURNING id, tax_id, legal_name`,
    tenantId, clientData.taxId, clientData.name, clientData.segment, clientData.email, userId
  );
  return row;
}

// ==========================================
// JOBS
// ==========================================

export async function getJobs(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);
  const rows = await execute<{
    id: string; job_code: string; title: string; description: string;
    priority: string; status: string; planned_start_date: string; planned_end_date: string;
  }>(
    `SELECT id, job_code, title, description, priority, status, planned_start_date, planned_end_date
     FROM jobs WHERE tenant_id = $1 ORDER BY created_at DESC`,
    tenantId
  );

  return rows.map((job) => ({
    id: job.id,
    code: job.job_code,
    description: job.title,
    assignedTech: tenantId.startsWith("b") ? "Ing. Administrador Apex" : "Ing. Administrador VentiTech",
    priority: (job.priority === "HIGH" ? "ALTA" : job.priority === "LOW" ? "BAJA" : "MEDIA") as "BAJA" | "MEDIA" | "ALTA",
    startDate: job.planned_start_date ? job.planned_start_date.substring(0, 10) : "",
    endDate: job.planned_end_date ? job.planned_end_date.substring(0, 10) : "",
    status: (job.status === "EN_EJECUCION" ? "EN_PROGRESO" : job.status) as "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA",
  }));
}

export async function createJob(
  tenantCode: string | null,
  jobData: { description: string; assignedTech: string; priority: string; startDate: string; endDate: string }
) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";
  const siteId = tenantId.startsWith("b") ? "b1000000-0000-0000-0000-000000000000" : "a1000000-0000-0000-0000-000000000000";
  const areaId = tenantId.startsWith("b") ? "b7000000-0000-0000-0000-000000000000" : "a7000000-0000-0000-0000-000000000000";

  const client = await queryOne<{ id: string }>("SELECT id FROM clients WHERE tenant_id = $1 AND deleted_at IS NULL LIMIT 1", tenantId);
  const req = await queryOne<{ id: string }>("SELECT id FROM requirements WHERE tenant_id = $1 LIMIT 1", tenantId);
  const countRow = await queryOne<{ c: string }>("SELECT count(*)::text as c FROM jobs WHERE tenant_id = $1", tenantId);
  const seq = (parseInt(countRow?.c || "0")) + 1;
  const code = `JOB-2026-${String(seq).padStart(3, "0")}`;

  const row = await queryOne(
    `INSERT INTO jobs (tenant_id, job_code, client_id, requirement_id, site_id, area_id, title, description, assigned_user_id, planned_start_date, planned_end_date, priority, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PENDIENTE',$13) RETURNING *`,
    tenantId, code, client?.id || "a3000000-0000-0000-0000-000000000000",
    req?.id || "a8000000-0000-0000-0000-000000000000", siteId, areaId,
    jobData.description.substring(0, 100), jobData.description, userId,
    new Date(jobData.startDate).toISOString(), new Date(jobData.endDate).toISOString(),
    jobData.priority === "ALTA" ? "HIGH" : jobData.priority === "BAJA" ? "LOW" : "MEDIUM",
    userId
  );
  return row;
}

// ==========================================
// INVENTORY
// ==========================================

export async function getInventoryStock(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);
  const rows = await execute<{
    quantity: string; reserved_quantity: string; available_quantity: string;
    wh_id: string; wh_name: string; wh_code: string;
    item_id: string; item_name: string; item_code: string; item_category: string; item_unit: string;
  }>(
    `SELECT s.quantity, s.reserved_quantity, s.available_quantity,
            w.id as wh_id, w.name as wh_name, w.warehouse_code as wh_code,
            i.id as item_id, i.name as item_name, i.item_code, i.category as item_category, i.unit_type as item_unit
     FROM inventory_stock s
     JOIN warehouses w ON w.id = s.warehouse_id
     JOIN inventory_items i ON i.id = s.item_id
     WHERE s.tenant_id = $1`,
    tenantId
  );

  return rows.map((row: any) => ({
    id: `${row.wh_id}-${row.item_id}`,
    warehouseCode: row.wh_code || "",
    warehouseName: row.wh_name || "",
    itemCode: row.item_code || "",
    itemName: row.item_name || "",
    sku: row.item_code || "",
    category: row.item_category || "",
    unit: row.item_unit || "Unidad",
    quantity: Number(row.quantity),
    reserved: Number(row.reserved_quantity),
    available: Number(row.available_quantity),
  }));
}

export async function createInventoryMovement(
  tenantCode: string | null,
  movement: { type: string; itemCode: string; quantity: number; notes: string; sourceWarehouse: string; destWarehouse?: string }
) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

  const item = await queryOne<{ id: string; purchase_price: string }>(
    "SELECT id, purchase_price FROM inventory_items WHERE tenant_id = $1 AND item_code = $2 LIMIT 1",
    tenantId, movement.itemCode
  );
  if (!item) throw new Error(`Artículo con código ${movement.itemCode} no encontrado.`);

  const srcWh = await queryOne<{ id: string }>(
    "SELECT id FROM warehouses WHERE tenant_id = $1 AND warehouse_code = $2 LIMIT 1",
    tenantId, movement.sourceWarehouse
  );
  if (!srcWh) throw new Error(`Bodega origen ${movement.sourceWarehouse} no encontrada.`);

  let destWhId: string | null = null;
  if (movement.type === "Transferencia" && movement.destWarehouse) {
    const destWh = await queryOne<{ id: string }>(
      "SELECT id FROM warehouses WHERE tenant_id = $1 AND warehouse_code = $2 LIMIT 1",
      tenantId, movement.destWarehouse
    );
    if (!destWh) throw new Error(`Bodega destino ${movement.destWarehouse} no encontrada.`);
    destWhId = destWh.id;
  }

  const countRow = await queryOne<{ c: string }>(
    "SELECT count(*)::text as c FROM inventory_movements WHERE tenant_id = $1", tenantId
  );
  const seq = (parseInt(countRow?.c || "0")) + 1;
  const code = `MOV-2026-${String(seq).padStart(4, "0")}`;

  const row = await queryOne(
    `INSERT INTO inventory_movements (tenant_id, movement_code, item_id, movement_type, quantity, unit_cost, notes, status, created_by, warehouse_id, source_warehouse_id, destination_warehouse_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Aplicado',$8,$9,$10,$11) RETURNING *`,
    tenantId, code, item.id, movement.type, movement.quantity,
    Number(item.purchase_price || 0), movement.notes, userId,
    movement.type !== "Transferencia" ? srcWh.id : null,
    movement.type === "Transferencia" ? srcWh.id : null,
    destWhId
  );
  return row;
}

// ==========================================
// INVOICES
// ==========================================

export async function getInvoices(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);
  const rows = await execute<{
    id: string; invoice_code: string; total_amount: string; paid_amount: string;
    balance_amount: string; status: string; invoice_date: string; legal_name: string;
  }>(
    `SELECT i.id, i.invoice_code, i.total_amount::text, i.paid_amount::text, i.balance_amount::text,
            i.status, i.invoice_date, c.legal_name
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
     ORDER BY i.created_at DESC`,
    tenantId
  );

  return rows.map((inv: any) => ({
    id: inv.id,
    code: inv.invoice_code,
    clientName: inv.legal_name || "Cliente General",
    totalAmount: Number(inv.total_amount),
    paidAmount: Number(inv.paid_amount || 0),
    status: inv.status as "BORRADOR" | "EMITIDA" | "PARCIALMENTE_PAGADA" | "PAGADA" | "ANULADA",
    date: inv.invoice_date ? inv.invoice_date.substring(0, 10) : "",
  }));
}

export async function createInvoice(
  tenantCode: string | null,
  invoiceData: { clientName: string; concept: string; amount: number }
) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

  let client = await queryOne<{ id: string }>(
    "SELECT id FROM clients WHERE tenant_id = $1 AND legal_name = $2 AND deleted_at IS NULL LIMIT 1",
    tenantId, invoiceData.clientName
  );
  if (!client) {
    client = await queryOne<{ id: string }>(
      "SELECT id FROM clients WHERE tenant_id = $1 AND deleted_at IS NULL LIMIT 1", tenantId
    );
  }

  const countRow = await queryOne<{ c: string }>("SELECT count(*)::text as c FROM invoices WHERE tenant_id = $1", tenantId);
  const seq = (parseInt(countRow?.c || "0")) + 1;
  const code = `FAC-2026-${String(seq).padStart(4, "0")}`;

  const invoice = await queryOne<{ id: string }>(
    `INSERT INTO invoices (tenant_id, invoice_code, client_id, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, paid_amount, balance_amount, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,0,$7,0,$8,'EMITIDA',$9) RETURNING id`,
    tenantId, code, client?.id || "a3000000-0000-0000-0000-000000000000",
    new Date().toISOString().substring(0, 10),
    new Date(Date.now() + 30 * 86400000).toISOString(),
    invoiceData.amount, invoiceData.amount, invoiceData.amount, userId
  );

  if (invoice) {
    await execute(
      "INSERT INTO invoice_items (tenant_id, invoice_id, description, quantity, unit_price, line_total) VALUES ($1,$2,$3,1,$4,$5)",
      tenantId, invoice.id, invoiceData.concept, invoiceData.amount, invoiceData.amount
    );
  }

  return invoice;
}

// ==========================================
// TENANT SETTINGS
// ==========================================

export async function getTenantSettings(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);

  const rows = await execute<{
    module: string; config_key: string; config_value: string; is_encrypted: boolean;
  }>(
    `SELECT module, config_key, config_value, is_encrypted
     FROM tenant_settings
     WHERE tenant_id = $1 AND deleted_at IS NULL`,
    tenantId
  );

  const settings: Record<string, any> = {};
  for (const row of rows) {
    settings[row.config_key] = row.config_value;
  }
  return settings;
}

export async function updateTenantSettings(
  tenantCode: string | null,
  module: string,
  key: string,
  value: any,
  isEncrypted: boolean = false
) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

  const row = await queryOne(
    `INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, is_encrypted, updated_by, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (tenant_id, module, config_key)
     DO UPDATE SET config_value = $4, is_encrypted = $5, updated_by = $6, updated_at = NOW()
     RETURNING *`,
    tenantId, module, key, String(value), isEncrypted, userId
  );

  return row;
}
