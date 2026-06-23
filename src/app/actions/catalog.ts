"use server";

import { execute, queryOne } from "@/utils/db";
import { getTenantId } from "@/app/actions";

export interface CatalogCategory {
  id: string;
  categoryCode: string;
  name: string;
  description: string;
  subcategories: any[];
}

/**
 * Obtiene la jerarquía completa del Catálogo Industrial para un tenant.
 * Optimizado con queries planas en vez de loops anidados N+1.
 */
export async function getIndustrialCatalog(tenantCode?: string | null): Promise<CatalogCategory[]> {
  const tenantId = await getTenantId(tenantCode);

  // Fetch all levels in parallel
  const [categories, subcategories, families, series, products] = await Promise.all([
    execute<any>("SELECT id, category_code, name, description FROM product_categories WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name", tenantId),
    execute<any>("SELECT id, subcategory_code, name, description, category_id FROM product_subcategories WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name", tenantId),
    execute<any>("SELECT id, family_code, name, description, subcategory_id FROM product_families WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name", tenantId),
    execute<any>("SELECT id, series_code, name, description, family_id FROM product_series WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name", tenantId),
    execute<any>("SELECT id, product_code, name, description, status, series_id FROM products WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name", tenantId),
  ]);

  // Fetch all specs in one query
  const allSpecs = await execute<{ product_id: string; spec_name: string; spec_value: string }>(
    "SELECT product_id, spec_name, spec_value FROM product_specifications WHERE product_id = ANY($1)",
    products.map((p: any) => p.id)
  );

  // Build spec map by product
  const specMap: Record<string, Record<string, string>> = {};
  for (const s of allSpecs) {
    if (!specMap[s.product_id]) specMap[s.product_id] = {};
    specMap[s.product_id][s.spec_name] = s.spec_value;
  }

  // Build product lookup
  const prodLookup: Record<string, any[]> = {};
  for (const p of products) {
    if (!prodLookup[p.series_id]) prodLookup[p.series_id] = [];
    prodLookup[p.series_id].push({
      id: p.id,
      productCode: p.product_code,
      name: p.name,
      description: p.description || "",
      status: p.status,
      specifications: specMap[p.id] || {},
      images: [],
      documents: [],
      cadFiles: [],
    });
  }

  // Build series lookup
  const serLookup: Record<string, any[]> = {};
  for (const s of series) {
    if (!serLookup[s.family_id]) serLookup[s.family_id] = [];
    serLookup[s.family_id].push({
      id: s.id,
      seriesCode: s.series_code,
      name: s.name,
      description: s.description || "",
      products: prodLookup[s.id] || [],
    });
  }

  // Build family lookup
  const famLookup: Record<string, any[]> = {};
  for (const f of families) {
    if (!famLookup[f.subcategory_id]) famLookup[f.subcategory_id] = [];
    famLookup[f.subcategory_id].push({
      id: f.id,
      familyCode: f.family_code,
      name: f.name,
      description: f.description || "",
      series: serLookup[f.id] || [],
    });
  }

  // Build subcategory lookup
  const subLookup: Record<string, any[]> = {};
  for (const s of subcategories) {
    if (!subLookup[s.category_id]) subLookup[s.category_id] = [];
    subLookup[s.category_id].push({
      id: s.id,
      subcategoryCode: s.subcategory_code,
      name: s.name,
      description: s.description || "",
      families: famLookup[s.id] || [],
    });
  }

  return categories.map((cat: any) => ({
    id: cat.id,
    categoryCode: cat.category_code,
    name: cat.name,
    description: cat.description || "",
    subcategories: subLookup[cat.id] || [],
  }));
}

/**
 * Guarda o actualiza un producto.
 */
export async function saveProduct(
  tenantCode: string | null,
  product: { id?: string; productCode: string; name: string; description: string; status: string; seriesId: string; specifications: Record<string, string> }
) {
  try {
    const tenantId = await getTenantId(tenantCode);
    const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";
    let productId = product.id;

    if (productId) {
      await execute(
        `UPDATE products SET product_code=$1, name=$2, description=$3, status=$4, series_id=$5, updated_by=$6, updated_at=NOW() WHERE id=$7 AND tenant_id=$8`,
        product.productCode, product.name, product.description, product.status || "ACTIVO", product.seriesId, userId, productId, tenantId
      );
    } else {
      const row = await queryOne<{ id: string }>(
        `INSERT INTO products (tenant_id, product_code, name, description, status, series_id, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        tenantId, product.productCode, product.name, product.description, product.status || "ACTIVO", product.seriesId, userId, userId
      );
      productId = row?.id;
    }

    if (productId) {
      await execute("DELETE FROM product_specifications WHERE product_id = $1", productId);
      for (const [name, val] of Object.entries(product.specifications || {})) {
        await execute(
          "INSERT INTO product_specifications (product_id, spec_name, spec_value) VALUES ($1,$2,$3)",
          productId, name, val
        );
      }
    }
    return { success: true, productId };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function deleteProduct(tenantCode: string | null, productId: string) {
  try {
    const tenantId = await getTenantId(tenantCode);
    await execute("UPDATE products SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2", productId, tenantId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function saveCategory(tenantCode: string | null, category: { id?: string; categoryCode: string; name: string; description: string }) {
  try {
    const tenantId = await getTenantId(tenantCode);
    const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";
    if (category.id) {
      await execute(
        "UPDATE product_categories SET category_code=$1, name=$2, description=$3, updated_by=$4, updated_at=NOW() WHERE id=$5 AND tenant_id=$6",
        category.categoryCode, category.name, category.description, userId, category.id, tenantId
      );
    } else {
      await execute(
        "INSERT INTO product_categories (tenant_id, category_code, name, description, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6)",
        tenantId, category.categoryCode, category.name, category.description, userId, userId
      );
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function deleteCategory(tenantCode: string | null, categoryId: string) {
  try {
    const tenantId = await getTenantId(tenantCode);
    await execute("UPDATE product_categories SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2", categoryId, tenantId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
