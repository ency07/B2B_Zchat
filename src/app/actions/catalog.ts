"use server";

import { supabaseAdmin } from "@/utils/supabase";
import { getTenantId } from "@/app/actions";

export interface ProductMedia {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  altText: string;
}

export interface ProductDetail {
  id: string;
  productCode: string;
  name: string;
  description: string;
  status: string;
  specifications: Record<string, string>;
  images: ProductMedia[];
  documents: ProductMedia[];
  cadFiles: ProductMedia[];
  seo?: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    slug: string;
  };
}

export interface CatalogSeries {
  id: string;
  seriesCode: string;
  name: string;
  description: string;
  products: ProductDetail[];
}

export interface CatalogFamily {
  id: string;
  familyCode: string;
  name: string;
  description: string;
  series: CatalogSeries[];
}

export interface CatalogSubcategory {
  id: string;
  subcategoryCode: string;
  name: string;
  description: string;
  families: CatalogFamily[];
}

export interface CatalogCategory {
  id: string;
  categoryCode: string;
  name: string;
  description: string;
  subcategories: CatalogSubcategory[];
}

/**
 * Obtiene la jerarquía completa del Catálogo Industrial de productos para un tenant.
 */
export async function getIndustrialCatalog(tenantCode?: string | null): Promise<CatalogCategory[]> {
  const tenantId = await getTenantId(tenantCode);

  // 1. Obtener Categorías
  const { data: categories, error: catError } = await supabaseAdmin
    .from("product_categories")
    .select("id, category_code, name, description")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (catError) {
    console.error("Error fetching categories:", catError);
    throw new Error(catError.message);
  }

  const catalog: CatalogCategory[] = [];

  for (const cat of categories || []) {
    // 2. Obtener Subcategorías
    const { data: subcategories, error: subError } = await supabaseAdmin
      .from("product_subcategories")
      .select("id, subcategory_code, name, description")
      .eq("tenant_id", tenantId)
      .eq("category_id", cat.id)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (subError) continue;

    const parsedSubcategories: CatalogSubcategory[] = [];

    for (const subcat of subcategories || []) {
      // 3. Obtener Familias
      const { data: families, error: famError } = await supabaseAdmin
        .from("product_families")
        .select("id, family_code, name, description")
        .eq("tenant_id", tenantId)
        .eq("subcategory_id", subcat.id)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (famError) continue;

      const parsedFamilies: CatalogFamily[] = [];

      for (const fam of families || []) {
        // 4. Obtener Series
        const { data: series, error: serError } = await supabaseAdmin
          .from("product_series")
          .select("id, series_code, name, description")
          .eq("tenant_id", tenantId)
          .eq("family_id", fam.id)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        if (serError) continue;

        const parsedSeries: CatalogSeries[] = [];

        for (const ser of series || []) {
          // 5. Obtener Productos de la Serie
          const { data: products, error: prodError } = await supabaseAdmin
            .from("products")
            .select("id, product_code, name, description, status")
            .eq("tenant_id", tenantId)
            .eq("series_id", ser.id)
            .is("deleted_at", null)
            .order("name", { ascending: true });

          if (prodError) continue;

          const parsedProducts: ProductDetail[] = [];

          for (const prod of products || []) {
            // A. Especificaciones
            const { data: specs } = await supabaseAdmin
              .from("product_specifications")
              .select("spec_name, spec_value")
              .eq("product_id", prod.id);

            const specMap: Record<string, string> = {};
            (specs || []).forEach(s => {
              specMap[s.spec_name] = s.spec_value;
            });

            // B. Imágenes mediante Media Manager
            const { data: imgData } = await supabaseAdmin
              .from("product_images")
              .select("sort_order, media_assets(id, file_name, file_path, file_size, mime_type, alt_text)")
              .eq("product_id", prod.id)
              .is("deleted_at", null)
              .order("sort_order", { ascending: true });

            const images: ProductMedia[] = (imgData || [])
              .map((img: any) => img.media_assets)
              .filter(Boolean)
              .map((asset: any) => ({
                id: asset.id,
                fileName: asset.file_name,
                filePath: asset.file_path,
                fileSize: asset.file_size,
                mimeType: asset.mime_type,
                altText: asset.alt_text || ""
              }));

            // C. Documentos (PDFs, Fichas Técnicas)
            const { data: docData } = await supabaseAdmin
              .from("product_documents")
              .select("media_assets(id, file_name, file_path, file_size, mime_type, alt_text)")
              .eq("product_id", prod.id)
              .is("deleted_at", null);

            const documents: ProductMedia[] = (docData || [])
              .map((doc: any) => doc.media_assets)
              .filter(Boolean)
              .map((asset: any) => ({
                id: asset.id,
                fileName: asset.file_name,
                filePath: asset.file_path,
                fileSize: asset.file_size,
                mimeType: asset.mime_type,
                altText: asset.alt_text || ""
              }));

            // D. Archivos CAD (STEP, DWG)
            const { data: cadData } = await supabaseAdmin
              .from("product_files")
              .select("media_assets(id, file_name, file_path, file_size, mime_type, alt_text)")
              .eq("product_id", prod.id)
              .is("deleted_at", null);

            const cadFiles: ProductMedia[] = (cadData || [])
              .map((cad: any) => cad.media_assets)
              .filter(Boolean)
              .map((asset: any) => ({
                id: asset.id,
                fileName: asset.file_name,
                filePath: asset.file_path,
                fileSize: asset.file_size,
                mimeType: asset.mime_type,
                altText: asset.alt_text || ""
              }));

            // E. SEO Metadata
            const { data: seo } = await supabaseAdmin
              .from("seo_metadata")
              .select("meta_title, meta_description, meta_keywords, slug")
              .eq("entity_type", "PRODUCT")
              .eq("entity_id", prod.id)
              .is("deleted_at", null)
              .maybeSingle();

            parsedProducts.push({
              id: prod.id,
              productCode: prod.product_code,
              name: prod.name,
              description: prod.description || "",
              status: prod.status,
              specifications: specMap,
              images,
              documents,
              cadFiles,
              seo: seo ? {
                metaTitle: seo.meta_title,
                metaDescription: seo.meta_description,
                metaKeywords: seo.meta_keywords || "",
                slug: seo.slug
              } : undefined
            });
          }

          parsedSeries.push({
            id: ser.id,
            seriesCode: ser.series_code,
            name: ser.name,
            description: ser.description || "",
            products: parsedProducts
          });
        }

        parsedFamilies.push({
          id: fam.id,
          familyCode: fam.family_code,
          name: fam.name,
          description: fam.description || "",
          series: parsedSeries
        });
      }

      parsedSubcategories.push({
        id: subcat.id,
        subcategoryCode: subcat.subcategory_code,
        name: subcat.name,
        description: subcat.description || "",
        families: parsedFamilies
      });
    }

    catalog.push({
      id: cat.id,
      categoryCode: cat.category_code,
      name: cat.name,
      description: cat.description || "",
      subcategories: parsedSubcategories
    });
  }

  return catalog;
}

/**
 * Registra un activo multimedia en el Media Manager y lo asocia a un producto.
 */
export async function addProductImage(
  tenantCode: string | null,
  productId: string,
  image: { fileName: string; filePath: string; fileSize: number; mimeType: string; altText?: string }
) {
  const tenantId = await getTenantId(tenantCode);

  // 1. Insertar el asset multimedia
  const { data: asset, error: assetError } = await supabaseAdmin
    .from("media_assets")
    .insert({
      tenant_id: tenantId,
      file_name: image.fileName,
      file_path: image.filePath,
      file_size: image.fileSize,
      mime_type: image.mimeType,
      alt_text: image.altText || "",
      usage_count: 1
    })
    .select()
    .single();

  if (assetError) {
    console.error("Error inserting media asset:", assetError);
    throw new Error(assetError.message);
  }

  // 2. Asociar el asset al producto en la tabla product_images
  const { data: prodImg, error: linkError } = await supabaseAdmin
    .from("product_images")
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      media_asset_id: asset.id,
      sort_order: 10 // por defecto al final
    })
    .select()
    .single();

  if (linkError) {
    console.error("Error linking image to product:", linkError);
    throw new Error(linkError.message);
  }

  return { asset, prodImg };
}

/**
 * Guarda o actualiza un producto en el catálogo, incluyendo sus especificaciones técnicas.
 */
export async function saveProduct(
  tenantCode: string | null,
  product: {
    id?: string;
    productCode: string;
    name: string;
    description: string;
    status: string;
    seriesId: string;
    specifications: Record<string, string>;
  }
) {
  try {
    const tenantId = await getTenantId(tenantCode);
    const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
      ? "b9000000-0000-0000-0000-000000000000"
      : "a9000000-0000-0000-0000-000000000000";

    let productId = product.id;

    const productPayload = {
      tenant_id: tenantId,
      product_code: product.productCode,
      name: product.name,
      description: product.description,
      status: product.status || "ACTIVO",
      series_id: product.seriesId,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    if (productId) {
      // Update
      const { error: updateErr } = await supabaseAdmin
        .from("products")
        .update(productPayload)
        .eq("id", productId)
        .eq("tenant_id", tenantId);

      if (updateErr) throw new Error(updateErr.message);
    } else {
      // Insert
      const { data: newProd, error: insertErr } = await supabaseAdmin
        .from("products")
        .insert({
          ...productPayload,
          created_by: userId
        })
        .select("id")
        .single();

      if (insertErr) throw new Error(insertErr.message);
      productId = newProd.id;
    }

    // Update specifications (delete old ones, insert new ones)
    if (productId) {
      const { error: deleteSpecsErr } = await supabaseAdmin
        .from("product_specifications")
        .delete()
        .eq("product_id", productId);

      if (deleteSpecsErr) console.error("Error clearing specs:", deleteSpecsErr);

      const specRows = Object.entries(product.specifications || {}).map(([name, val]) => ({
        product_id: productId,
        spec_name: name,
        spec_value: val
      }));

      if (specRows.length > 0) {
        const { error: insertSpecsErr } = await supabaseAdmin
          .from("product_specifications")
          .insert(specRows);

        if (insertSpecsErr) throw new Error(insertSpecsErr.message);
      }
    }

    return { success: true, productId };
  } catch (err: any) {
    console.error("Exception in saveProduct:", err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Soft-delete de un producto del catálogo.
 */
export async function deleteProduct(tenantCode: string | null, productId: string) {
  try {
    const tenantId = await getTenantId(tenantCode);
    const { error } = await supabaseAdmin
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    console.error("Exception in deleteProduct:", err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Guarda o actualiza una categoría de producto.
 */
export async function saveCategory(
  tenantCode: string | null,
  category: {
    id?: string;
    categoryCode: string;
    name: string;
    description: string;
  }
) {
  try {
    const tenantId = await getTenantId(tenantCode);
    const userId = tenantId === "b0000000-0000-0000-0000-000000000000"
      ? "b9000000-0000-0000-0000-000000000000"
      : "a9000000-0000-0000-0000-000000000000";

    const payload = {
      tenant_id: tenantId,
      category_code: category.categoryCode,
      name: category.name,
      description: category.description,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    if (category.id) {
      const { error } = await supabaseAdmin
        .from("product_categories")
        .update(payload)
        .eq("id", category.id)
        .eq("tenant_id", tenantId);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("product_categories")
        .insert({
          ...payload,
          created_by: userId
        });

      if (error) throw new Error(error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Exception in saveCategory:", err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Soft-delete de una categoría.
 */
export async function deleteCategory(tenantCode: string | null, categoryId: string) {
  try {
    const tenantId = await getTenantId(tenantCode);
    const { error } = await supabaseAdmin
      .from("product_categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", categoryId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    console.error("Exception in deleteCategory:", err);
    return { success: false, error: err.message || String(err) };
  }
}

