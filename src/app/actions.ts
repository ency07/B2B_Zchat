"use server";

import { supabaseAdmin } from "@/utils/supabase";

export async function getTenantId(tenantCode?: string | null): Promise<string> {
  if (tenantCode === "apex") {
    return "b0000000-0000-0000-0000-000000000000";
  }
  return "a0000000-0000-0000-0000-000000000000"; // default to acme
}

// ==========================================
// CLIENTS ACTIONS
// ==========================================

export async function getClients(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, tax_id, legal_name, industry, status")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    throw new Error(error.message);
  }

  // Calculate sum of total invoiced for each client
  const clientsWithInvoiced = await Promise.all(
    (data || []).map(async (client) => {
      const { data: invoices } = await supabaseAdmin
        .from("invoices")
        .select("total_amount")
        .eq("client_id", client.id)
        .is("deleted_at", null)
        .in("status", ["EMITIDA", "PARCIALMENTE_PAGADA", "PAGADA"]);

      const totalInvoiced = (invoices || []).reduce(
        (sum, inv) => sum + Number(inv.total_amount || 0),
        0
      );

      return {
        id: client.id,
        taxId: client.tax_id,
        name: client.legal_name,
        segment: client.industry || "General",
        totalInvoiced,
        status: (client.status === "ACTIVO" ? "ACTIVO" : client.status === "INACTIVO" ? "SUSPENDIDO" : "PENDIENTE") as "ACTIVO" | "SUSPENDIDO" | "PENDIENTE",
      };
    })
  );

  return clientsWithInvoiced;
}

export async function createClient(
  tenantCode: string | null,
  clientData: { taxId: string; name: string; segment: string; email: string }
) {
  const tenantId = await getTenantId(tenantCode);
  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";
  
  // First, verify if client already exists (to prevent duplicate constraint error)
  const { data: existing } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("tax_id", clientData.taxId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    throw new Error("Ya existe un cliente con este RFC para este tenant.");
  }

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      tenant_id: tenantId,
      tax_id: clientData.taxId,
      legal_name: clientData.name,
      industry: clientData.segment,
      email: clientData.email,
      client_type: "Empresa",
      country: "México",
      assigned_user_id: userId,
      status: "ACTIVO",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating client:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// JOBS ACTIONS
// ==========================================

export async function getJobs(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("id, job_code, title, description, priority, status, planned_start_date, planned_end_date")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    throw new Error(error.message);
  }

  return (data || []).map((job) => ({
    id: job.id,
    code: job.job_code,
    description: job.title,
    assignedTech: tenantId === "b0000000-0000-0000-0000-000000000000" ? "Ing. Administrador Apex" : "Ing. Administrador VentiTech",
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

  // Retrieve default references to satisfy constraints
  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .limit(1)
    .single();

  const { data: req } = await supabaseAdmin
    .from("requirements")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(1)
    .single();

  const siteId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b1000000-0000-0000-0000-000000000000"
    : "a1000000-0000-0000-0000-000000000000";

  const areaId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b7000000-0000-0000-0000-000000000000"
    : "a7000000-0000-0000-0000-000000000000";

  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";

  // Calculate next sequential code
  const { count } = await supabaseAdmin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const seq = (count || 0) + 1;
  const code = `JOB-2026-${String(seq).padStart(3, "0")}`;

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert({
      tenant_id: tenantId,
      job_code: code,
      client_id: client?.id || "a3000000-0000-0000-0000-000000000000",
      requirement_id: req?.id || "a8000000-0000-0000-0000-000000000000",
      site_id: siteId,
      area_id: areaId,
      title: jobData.description.substring(0, 100),
      description: jobData.description,
      assigned_user_id: userId,
      planned_start_date: new Date(jobData.startDate).toISOString(),
      planned_end_date: new Date(jobData.endDate).toISOString(),
      priority: jobData.priority === "ALTA" ? "HIGH" : jobData.priority === "BAJA" ? "LOW" : "MEDIUM",
      status: "PENDIENTE",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating job:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// INVENTORY ACTIONS
// ==========================================

export async function getInventoryStock(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);
  
  const { data, error } = await supabaseAdmin
    .from("inventory_stock")
    .select(`
      quantity,
      reserved_quantity,
      available_quantity,
      warehouses (id, name, warehouse_code),
      inventory_items (id, name, item_code, category, unit_type)
    `)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error fetching inventory stock:", error);
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: `${row.warehouses?.id}-${row.inventory_items?.id}`,
    warehouseCode: row.warehouses?.warehouse_code || "",
    warehouseName: row.warehouses?.name || "",
    itemCode: row.inventory_items?.item_code || "",
    itemName: row.inventory_items?.name || "",
    sku: row.inventory_items?.item_code || "",
    category: row.inventory_items?.category || "",
    unit: row.inventory_items?.unit_type || "Unidad",
    quantity: Number(row.quantity),
    reserved: Number(row.reserved_quantity),
    available: Number(row.available_quantity),
  }));
}

export async function createInventoryMovement(
  tenantCode: string | null,
  movement: {
    type: "Entrada" | "Salida" | "Transferencia";
    itemCode: string;
    quantity: number;
    notes: string;
    sourceWarehouse: string; // warehouse_code
    destWarehouse?: string;  // warehouse_code
  }
) {
  const tenantId = await getTenantId(tenantCode);

  // Get item_id
  const { data: item } = await supabaseAdmin
    .from("inventory_items")
    .select("id, purchase_price")
    .eq("tenant_id", tenantId)
    .eq("item_code", movement.itemCode)
    .limit(1)
    .single();

  if (!item) {
    throw new Error(`Artículo con código ${movement.itemCode} no encontrado.`);
  }

  // Get warehouses
  const { data: sourceWh } = await supabaseAdmin
    .from("warehouses")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("warehouse_code", movement.sourceWarehouse)
    .limit(1)
    .single();

  if (!sourceWh) {
    throw new Error(`Bodega origen ${movement.sourceWarehouse} no encontrada.`);
  }

  let destWhId = null;
  if (movement.type === "Transferencia" && movement.destWarehouse) {
    const { data: destWh } = await supabaseAdmin
      .from("warehouses")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("warehouse_code", movement.destWarehouse)
      .limit(1)
      .single();

    if (!destWh) {
      throw new Error(`Bodega destino ${movement.destWarehouse} no encontrada.`);
    }
    destWhId = destWh.id;
  }

  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";

  // Calculate sequence code
  const { count } = await supabaseAdmin
    .from("inventory_movements")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const seq = (count || 0) + 1;
  const code = `MOV-2026-${String(seq).padStart(4, "0")}`;

  const insertPayload: any = {
    tenant_id: tenantId,
    movement_code: code,
    item_id: item.id,
    movement_type: movement.type,
    quantity: movement.quantity,
    unit_cost: item.purchase_price || 0,
    notes: movement.notes,
    status: "Aplicado", // Auto apply in this demo
    created_by: userId,
  };

  if (movement.type === "Transferencia") {
    insertPayload.source_warehouse_id = sourceWh.id;
    insertPayload.destination_warehouse_id = destWhId;
  } else {
    insertPayload.warehouse_id = sourceWh.id;
  }

  const { data, error } = await supabaseAdmin
    .from("inventory_movements")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("Error creating movement:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// INVOICES ACTIONS
// ==========================================

export async function getInvoices(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select(`
      id,
      invoice_code,
      total_amount,
      paid_amount,
      balance_amount,
      status,
      invoice_date,
      clients ( legal_name )
    `)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    throw new Error(error.message);
  }

  return (data || []).map((inv: any) => ({
    id: inv.id,
    code: inv.invoice_code,
    clientName: inv.clients?.legal_name || "Cliente General",
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

  // Get client matching the legal_name or pick the first client
  let { data: client } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("legal_name", invoiceData.clientName)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!client) {
    const { data: firstClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .limit(1)
      .single();
    client = firstClient;
  }

  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";

  // Calculate invoice code
  const { count } = await supabaseAdmin
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const seq = (count || 0) + 1;
  const code = `FAC-2026-${String(seq).padStart(4, "0")}`;

  // Insert invoice header
  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .insert({
      tenant_id: tenantId,
      invoice_code: code,
      client_id: client?.id || "a3000000-0000-0000-0000-000000000000",
      invoice_date: new Date().toISOString().substring(0, 10),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
      subtotal_amount: invoiceData.amount,
      tax_amount: 0,
      total_amount: invoiceData.amount,
      paid_amount: 0,
      balance_amount: invoiceData.amount,
      status: "EMITIDA",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error);
    throw new Error(error.message);
  }

  // Insert invoice items
  await supabaseAdmin.from("invoice_items").insert({
    tenant_id: tenantId,
    invoice_id: invoice.id,
    description: invoiceData.concept,
    quantity: 1,
    unit_price: invoiceData.amount,
    line_total: invoiceData.amount,
  });

  return invoice;
}

// ==========================================
// TENANT SETTINGS ACTIONS
// ==========================================

export async function getTenantSettings(tenantCode?: string | null) {
  const tenantId = await getTenantId(tenantCode);

  const { data, error } = await supabaseAdmin
    .from("tenant_settings")
    .select("module, config_key, config_value, is_encrypted")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching settings:", error);
    throw new Error(error.message);
  }

  // Reduce to record object, decrypting encrypted fields on the fly
  const settings: Record<string, any> = {};
  for (const row of (data || [])) {
    if (row.is_encrypted) {
      const { data: decryptedVal, error: decErr } = await supabaseAdmin
        .rpc("get_tenant_setting", {
          p_tenant_id: tenantId,
          p_module: row.module,
          p_key: row.config_key
        });
      
      if (decErr) {
        console.error(`Error decrypting key ${row.config_key}:`, decErr);
        settings[row.config_key] = row.config_value;
      } else {
        settings[row.config_key] = decryptedVal;
      }
    } else {
      settings[row.config_key] = row.config_value;
    }
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
  const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b9000000-0000-0000-0000-000000000000"
    : "a9000000-0000-0000-0000-000000000000";

  const { data, error } = await supabaseAdmin
    .from("tenant_settings")
    .upsert({
      tenant_id: tenantId,
      module: module,
      config_key: key,
      config_value: value,
      is_encrypted: isEncrypted,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "tenant_id,module,config_key"
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error(error.message);
  }

  return data;
}
