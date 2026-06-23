"use server";

import { execute, queryOne } from "@/utils/db";
import { getTenantId } from "@/app/actions";
import { BrandingConfig, getBrandingDefaults } from "@/utils/branding-defaults";

export interface BrandingVersion {
  id: string; version_number: number; config_values: BrandingConfig;
  description: string; created_at: string;
}

export async function getTenantBranding(tenantCode?: string | null): Promise<BrandingConfig> {
  const tenantId = await getTenantId(tenantCode);
  const defaults = getBrandingDefaults(tenantCode);

  const rows = await execute<{ module: string; config_key: string; config_value: string }>(
    `SELECT module, config_key, config_value FROM tenant_settings
     WHERE tenant_id = $1 AND module IN ('EMPRESA','LOCALIZACION','IDENTIDAD','DOCUMENTOS') AND deleted_at IS NULL`,
    tenantId
  );

  const config = { ...defaults };
  for (const row of rows) {
    const key = row.config_key as keyof BrandingConfig;
    if (key in config) (config as any)[key] = row.config_value;
  }
  return config;
}

export async function saveTenantBranding(
  tenantCode: string | null,
  data: Partial<BrandingConfig>,
  versionDescription?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await getTenantId(tenantCode);
    const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

    const keys = Object.keys(data) as Array<keyof BrandingConfig>;
    if (keys.length === 0) return { success: true };

    for (const key of keys) {
      let module = "IDENTIDAD";
      if (["nombre_comercial","razon_social","nit","direccion","ciudad","pais","telefono_principal","email_corporativo","web"].includes(key)) module = "EMPRESA";
      else if (["zona_horaria","idioma","moneda","formato_fecha","formato_hora","separador_decimal","separador_miles"].includes(key)) module = "LOCALIZACION";
      else if (["firma_url","sello_url"].includes(key)) module = "DOCUMENTOS";

      await execute(
        `INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, is_public, is_encrypted, updated_by, updated_at)
         VALUES ($1,$2,$3,$4,true,false,$5,NOW())
         ON CONFLICT (tenant_id, module, config_key) DO UPDATE SET config_value=$4, updated_by=$5, updated_at=NOW()`,
        tenantId, module, key, String(data[key] ?? ""), userId
      );
    }

    const activeBranding = await getTenantBranding(tenantCode);
    const latestVer = await queryOne<{ version_number: number }>(
      "SELECT version_number FROM tenant_branding_version WHERE tenant_id = $1 ORDER BY version_number DESC LIMIT 1", tenantId
    );
    const nextVersion = latestVer ? latestVer.version_number + 1 : 1;

    await execute(
      `INSERT INTO tenant_branding_version (tenant_id, version_number, config_values, description, created_by)
       VALUES ($1,$2,$3,$4,$5)`,
      tenantId, nextVersion, JSON.stringify(activeBranding),
      versionDescription || `Actualización de Branding (Versión ${nextVersion})`, userId
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function getBrandingHistory(tenantCode?: string | null): Promise<BrandingVersion[]> {
  const tenantId = await getTenantId(tenantCode);
  return execute(
    "SELECT id, version_number, config_values, description, created_at FROM tenant_branding_version WHERE tenant_id = $1 ORDER BY version_number DESC",
    tenantId
  );
}

export async function restoreBrandingVersion(
  tenantCode: string | null, versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await getTenantId(tenantCode);
    const userId = tenantId.startsWith("b") ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";

    const version = await queryOne<{ version_number: number; config_values: any }>(
      "SELECT version_number, config_values FROM tenant_branding_version WHERE id = $1 AND tenant_id = $2",
      versionId, tenantId
    );
    if (!version) return { success: false, error: "Versión no encontrada" };

    const config = version.config_values;
    for (const [key, value] of Object.entries(config)) {
      let module = "IDENTIDAD";
      if (["nombre_comercial","razon_social","nit","direccion","ciudad","pais","telefono_principal","email_corporativo","web"].includes(key)) module = "EMPRESA";
      else if (["zona_horaria","idioma","moneda","formato_fecha","formato_hora","separador_decimal","separador_miles"].includes(key)) module = "LOCALIZACION";
      else if (["firma_url","sello_url"].includes(key)) module = "DOCUMENTOS";

      await execute(
        `INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, is_public, is_encrypted, updated_by, updated_at)
         VALUES ($1,$2,$3,$4,true,false,$5,NOW())
         ON CONFLICT (tenant_id, module, config_key) DO UPDATE SET config_value=$4, updated_by=$5, updated_at=NOW()`,
        tenantId, module, key, String(value ?? ""), userId
      );
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

// Logo upload (stub — Neon DB no maneja archivos; usar Vercel Blob, S3 o Cloudinary)
export async function uploadBrandingLogo(
  _tenantCode: string | null, _fileType: string, _base64Data: string, _fileName: string, _mimeType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  return { success: false, error: "Storage no configurado. Usá Vercel Blob, S3 o Cloudinary." };
}
