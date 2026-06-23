"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Building,
  Palette,
  Network,
  FileText,
  History,
  Users,
  Save,
  CheckCircle,
  Upload,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Lock,
  Mail,
  Sliders,
  Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import {
  getTenantBranding,
  saveTenantBranding,
  getBrandingHistory,
  restoreBrandingVersion,
  uploadBrandingLogo,
  BrandingVersion
} from "@/app/actions/branding";
import { BrandingConfig, getBrandingDefaults } from "@/utils/branding-defaults";
import { getTenantSettings, updateTenantSettings } from "@/app/actions";
import { parseToHslChannels } from "@/utils/tenant";

type TabId = "empresa" | "whitelabel" | "integraciones" | "documentos" | "versiones" | "usuarios";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [activeTab, setActiveTab] = React.useState<TabId>("empresa");
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // ===== STATE =====
  const [brandingState, setBrandingState] = React.useState<BrandingConfig>(getBrandingDefaults(tenantParam));
  const [isBrandingLoading, setIsBrandingLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState<string | null>(null);
  const [historyList, setHistoryList] = React.useState<BrandingVersion[]>([]);
  const [versionDescription, setVersionDescription] = React.useState("");

  // Integrations state
  const [telegramToken, setTelegramToken] = React.useState("");
  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [smtpServer, setSmtpServer] = React.useState("smtp.mailgun.org");
  const [smtpUser, setSmtpUser] = React.useState("postmaster@ventitech.co");
  const [smtpPort, setSmtpPort] = React.useState("587");
  const [smtpPassword, setSmtpPassword] = React.useState("••••••••••••••••••••");

  // Load everything on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        // Load branding visual config
        const data = await getTenantBranding(tenantParam);
        setBrandingState(data);

        // Load integrations via getTenantSettings
        const allSettings = await getTenantSettings(tenantParam);
        if (allSettings.telegram_bot_token) setTelegramToken(allSettings.telegram_bot_token);
        if (allSettings.webhook_url) setWebhookUrl(allSettings.webhook_url);
        if (allSettings.smtp_server) setSmtpServer(allSettings.smtp_server);
        if (allSettings.smtp_user) setSmtpUser(allSettings.smtp_user);

        // Load branding snapshots history
        const history = await getBrandingHistory(tenantParam);
        setHistoryList(history);
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setIsBrandingLoading(false);
      }
    }
    loadData();
  }, [tenantParam]);

  const handleBrandingChange = (key: keyof BrandingConfig, val: string) => {
    setBrandingState(prev => ({ ...prev, [key]: val }));
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Save Empresa & White Label Visual configs
  const handleSaveBranding = async () => {
    setIsSubmitting(true);
    try {
      const desc = versionDescription.trim() || `Configuración guardada (${new Date().toLocaleDateString()})`;
      const res = await saveTenantBranding(tenantParam, brandingState, desc);
      if (!res.success) throw new Error(res.error || "No se pudo guardar");

      // Save to localStorage cache for real-time CSS update
      const cacheKey = `tenant_config_${tenantParam || "default"}`;
      localStorage.setItem(cacheKey, JSON.stringify(brandingState));

      // Inyectar variables de color de inmediato
      const root = document.documentElement;
      root.style.setProperty("--primary", parseToHslChannels(brandingState.color_primario));
      root.style.setProperty("--secondary", parseToHslChannels(brandingState.color_secundario));

      // Reload version history list
      const history = await getBrandingHistory(tenantParam);
      setHistoryList(history);
      setVersionDescription("");
      triggerSuccess("Configuración de marca y empresa guardada exitosamente.");
    } catch (err: any) {
      alert(`Error al guardar: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Technical Integrations
  const handleSaveIntegrations = async () => {
    setIsSubmitting(true);
    try {
      if (telegramToken.trim()) {
        await updateTenantSettings(tenantParam, "INTEGRACIONES", "telegram_bot_token", telegramToken.trim(), true);
      }
      if (webhookUrl.trim()) {
        await updateTenantSettings(tenantParam, "INTEGRACIONES", "webhook_url", webhookUrl.trim(), false);
      }
      if (smtpServer.trim()) {
        await updateTenantSettings(tenantParam, "INTEGRACIONES", "smtp_server", smtpServer.trim(), false);
      }
      if (smtpUser.trim()) {
        await updateTenantSettings(tenantParam, "INTEGRACIONES", "smtp_user", smtpUser.trim(), false);
      }
      triggerSuccess("Integraciones de servicios técnicos actualizadas.");
    } catch (err: any) {
      alert(`Error al guardar integraciones: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof BrandingConfig) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Límite de 2MB por imagen.");
      return;
    }
    setIsUploading(String(field));
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(",")[1];
        const res = await uploadBrandingLogo(tenantParam, field, base64Data, file.name, file.type);
        if (res.success && res.url) {
          handleBrandingChange(field, res.url);
        } else {
          alert(`Error: ${res.error}`);
        }
      } catch (err: any) {
        alert(`Error en carga: ${err.message || err}`);
      } finally {
        setIsUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm("¿Está seguro de que desea restaurar esta versión anterior del sistema?")) return;
    setIsSubmitting(true);
    try {
      const res = await restoreBrandingVersion(tenantParam, versionId);
      if (!res.success) throw new Error(res.error || "Fallo al restaurar");
      const data = await getTenantBranding(tenantParam);
      setBrandingState(data);
      const history = await getBrandingHistory(tenantParam);
      setHistoryList(history);
      triggerSuccess("Versión del sistema restaurada exitosamente.");
    } catch (err: any) {
      alert(`Error al restaurar: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "empresa", label: "Empresa Jurídica", icon: Building },
    { id: "whitelabel", label: "White Label (Apariencia)", icon: Palette },
    { id: "integraciones", label: "Integraciones API", icon: Network },
    { id: "documentos", label: "Correos & Firmas", icon: FileText },
    { id: "versiones", label: "Historial / Versiones", icon: History },
    { id: "usuarios", label: "Usuarios & Permisos", icon: Users },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Administración del Sistema
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Configuración
          </h1>
          <p className="text-sm text-muted-foreground">
            Configura el comportamiento, empresa jurídica, identidad corporativa y credenciales técnicas del ERP y Portal Cliente.
          </p>
        </div>

        {/* Action Button context-aware */}
        {(activeTab === "empresa" || activeTab === "whitelabel" || activeTab === "documentos") && (
          <Button
            onClick={handleSaveBranding}
            disabled={isSubmitting || isBrandingLoading}
            className="bg-primary hover:bg-primary/90 text-white text-xs h-9 px-5 cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <><Spinner className="w-3.5 h-3.5 mr-1.5" /> Guardando...</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1.5" /> Guardar Cambios</>
            )}
          </Button>
        )}

        {activeTab === "integraciones" && (
          <Button
            onClick={handleSaveIntegrations}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white text-xs h-9 px-5 cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <><Spinner className="w-3.5 h-3.5 mr-1.5" /> Guardando...</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1.5" /> Guardar Integraciones</>
            )}
          </Button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-semibold text-sm">Cambios Guardados</h4>
            <p className="text-xs opacity-90">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-border text-xs overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3.5 font-medium transition-colors border-b-2 relative -mb-[2px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md min-h-[480px]">
        
        {isBrandingLoading ? (
          <div className="text-center py-16 font-mono text-xs text-muted-foreground animate-pulse">Cargando datos del sistema...</div>
        ) : (
          <>
            {/* ==================== TAB: EMPRESA ==================== */}
            {activeTab === "empresa" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Entidad Jurídica</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Información Legal y Comercial de la Empresa</h3>
                  <p className="text-xs text-muted-foreground">Estos datos se reflejan en facturas, cotizaciones, correos y portal del cliente.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Razón Social</label>
                    <Input value={brandingState.razon_social} onChange={(e) => handleBrandingChange("razon_social", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Nombre Comercial</label>
                    <Input value={brandingState.nombre_comercial} onChange={(e) => handleBrandingChange("nombre_comercial", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">NIT / Identificación Fiscal</label>
                    <Input value={brandingState.nit} onChange={(e) => handleBrandingChange("nit", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">RUT (Registro Único Tributario)</label>
                    <Input placeholder="Ej. 110-A-B-12" className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs text-muted-foreground font-medium">Dirección Física</label>
                    <Input value={brandingState.direccion} onChange={(e) => handleBrandingChange("direccion", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Ciudad</label>
                    <Input value={brandingState.ciudad} onChange={(e) => handleBrandingChange("ciudad", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Departamento / Provincia / Estado</label>
                    <Input placeholder="Ej. Cundinamarca" className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">País</label>
                    <Input value={brandingState.pais} onChange={(e) => handleBrandingChange("pais", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Código Postal</label>
                    <Input placeholder="Ej. 110111" className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Teléfono Principal</label>
                    <Input value={brandingState.telefono_principal} onChange={(e) => handleBrandingChange("telefono_principal", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">WhatsApp Corporativo</label>
                    <Input value={brandingState.whatsapp} onChange={(e) => handleBrandingChange("whatsapp", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Correo Electrónico Principal</label>
                    <Input value={brandingState.email_corporativo} onChange={(e) => handleBrandingChange("email_corporativo", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Sitio Web</label>
                    <Input value={brandingState.web} onChange={(e) => handleBrandingChange("web", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Configuración Regional</span>
                  <h4 className="text-xs font-semibold text-foreground mt-0.5">Formatos de Fecha, Moneda y Zonas Horarias</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-muted-foreground font-medium">Zona Horaria</label>
                      <select value={brandingState.zona_horaria} onChange={(e) => handleBrandingChange("zona_horaria", e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                        <option value="America/Bogota">Bogotá (GMT-5)</option>
                        <option value="America/Mexico_City">CDMX (GMT-6)</option>
                        <option value="America/New_York">Nueva York (GMT-5)</option>
                        <option value="America/Santiago">Santiago (GMT-4)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-muted-foreground font-medium">Idioma de Interfaz</label>
                      <select value={brandingState.idioma} onChange={(e) => handleBrandingChange("idioma", e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                        <option value="es">Español (ES)</option>
                        <option value="en">English (EN)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-muted-foreground font-medium">Moneda Base</label>
                      <select value={brandingState.moneda} onChange={(e) => handleBrandingChange("moneda", e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                        <option value="COP">COP ($)</option>
                        <option value="USD">USD ($)</option>
                        <option value="MXN">MXN ($)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Snapshots desc */}
                <div className="border-t border-border pt-4 space-y-2">
                  <label className="text-[11px] text-muted-foreground font-medium">Descripción del snapshot para esta configuración (opcional)</label>
                  <Input value={versionDescription} onChange={(e) => setVersionDescription(e.target.value)} placeholder="Ej. Cambio de razón social legal..." className="bg-background border-border text-xs text-foreground" />
                </div>
              </div>
            )}

            {/* ==================== TAB: WHITE LABEL ==================== */}
            {activeTab === "whitelabel" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// White Label Personalización</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Apariencia Visual y Nombres del Software</h3>
                  <p className="text-xs text-muted-foreground">Configure logotipos, colores, bordes y tipografías aplicables al ERP y al Portal del Cliente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-foreground block">Nombres y Títulos</span>
                    <div className="grid grid-cols-1 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground font-medium">Nombre de la Aplicación ERP (Sidebar)</label>
                        <Input value={brandingState.nombre_erp} onChange={(e) => handleBrandingChange("nombre_erp", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground font-medium">Nombre del Portal de Clientes</label>
                        <Input value={brandingState.nombre_portal_cliente} onChange={(e) => handleBrandingChange("nombre_portal_cliente", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground font-medium">Título del Navegador de Aplicación</label>
                        <Input value={brandingState.titulo_navegador} onChange={(e) => handleBrandingChange("titulo_navegador", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <span className="text-xs font-bold text-foreground block">Tipografía y Bordes</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-muted-foreground font-medium">Tipografía Principal</label>
                          <select value={brandingState.tipografia_principal} onChange={(e) => handleBrandingChange("tipografia_principal", e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                            <option value="Inter">Inter (Recomendada)</option>
                            <option value="Outfit">Outfit</option>
                            <option value="Roboto">Roboto</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-muted-foreground font-medium">Borde de Paneles</label>
                          <select value={brandingState.border_radius} onChange={(e) => handleBrandingChange("border_radius", e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                            <option value="ninguno">Rectos (0px)</option>
                            <option value="sutil">4px</option>
                            <option value="8px">8px (Estándar)</option>
                            <option value="redondeado">12px</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-foreground block">Paleta de Colores HSL</span>
                    <div className="grid grid-cols-2 gap-3.5">
                      {[
                        { key: "color_primario", label: "Color Primario", desc: "Botones, links, hover" },
                        { key: "color_secundario", label: "Color Secundario", desc: "Sidebar, headers" },
                        { key: "color_exito", label: "Color de Éxito", desc: "Avances correctos" },
                        { key: "color_warning", label: "Color Advertencia", desc: "Preventivas" },
                        { key: "color_danger", label: "Color Peligro / Danger", desc: "SLA vencidos" },
                        { key: "color_info", label: "Color Informativo", desc: "Tooltips y novedades" }
                      ].map((item) => (
                        <div key={item.key} className="p-3 rounded-xl border border-border bg-card/40 space-y-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground block">{item.label}</span>
                          <div className="flex gap-2">
                            <input type="color" value={(brandingState as any)[item.key]} onChange={(e) => handleBrandingChange(item.key as any, e.target.value)} className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer shrink-0" />
                            <input type="text" value={(brandingState as any)[item.key]} onChange={(e) => handleBrandingChange(item.key as any, e.target.value)} className="w-full px-2 py-1 bg-background border border-border rounded text-[11px] font-mono text-foreground focus:outline-none focus:border-primary uppercase" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logos grid */}
                <div className="border-t border-border pt-6 space-y-4">
                  <span className="text-xs font-bold text-foreground block">Biblioteca de Logos Contextuales</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { field: "logo_claro_url", label: "Logo ERP (Fondo Claro)" },
                      { field: "logo_oscuro_url", label: "Logo ERP Negativo (Fondo Oscuro)" },
                      { field: "logo_login_url", label: "Logo de Pantalla de Login" },
                      { field: "logo_pdf_url", label: "Logo para PDFs e Informes" },
                      { field: "favicon_url", label: "Favicon (.ico, .png)" },
                    ].map((item) => {
                      const fKey = item.field as keyof BrandingConfig;
                      const hasLogo = !!(brandingState as any)[fKey];
                      return (
                        <div key={item.field} className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                          <span className="text-[11px] font-semibold text-muted-foreground block">{item.label}</span>
                          <div className="h-16 bg-muted/20 rounded-lg flex items-center justify-center border border-border/80 overflow-hidden relative">
                            {hasLogo ? (
                              <img src={(brandingState as any)[fKey]} alt={item.label} className="max-h-12 max-w-[90%] object-contain" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 font-mono">Sin imagen</span>
                            )}
                            {isUploading === fKey && (
                              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input type="file" id={`upload-${item.field}`} accept="image/*" onChange={(e) => handleFileUpload(e, fKey)} className="hidden" />
                            <label htmlFor={`upload-${item.field}`} className="flex-grow py-1 rounded bg-secondary/40 border border-border text-center text-[10px] text-foreground font-semibold hover:bg-secondary/60 cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                              <Upload className="w-3 h-3" /> Subir
                            </label>
                            {hasLogo && (
                              <button type="button" onClick={() => handleBrandingChange(fKey, "")} className="px-2 py-1 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 text-[10px] cursor-pointer">
                                Quitar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: INTEGRACIONES ==================== */}
            {activeTab === "integraciones" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Integraciones API y Servicios</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Credenciales Técnicas del Servidor</h3>
                  <p className="text-xs text-muted-foreground">Mapeo de APIs cifradas. No expuestas a clientes públicos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Telegram */}
                  <div className="p-5 rounded-xl border border-border bg-muted/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">Telegram Alertas SLA</h4>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground block font-mono">Telegram Bot Token</label>
                      <input
                        type="password"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="••••••••••••••••••••"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground block font-mono">Webhook URL</label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://api.yourdomain.com/webhook"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* SMTP Server */}
                  <div className="p-5 rounded-xl border border-border bg-muted/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">SMTP Servidor de Correos</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] text-muted-foreground block">Host Servidor</label>
                        <Input value={smtpServer} onChange={(e) => setSmtpServer(e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground block">Puerto</label>
                        <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground block">Usuario de Envío</label>
                      <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground block">Contraseña SMTP</label>
                      <input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Mock Integrations */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border pt-5">
                    {[
                      { name: "Stripe", desc: "Pagos de Facturas" },
                      { name: "MercadoPago", desc: "Pasarela Latam" },
                      { name: "WhatsApp Business", desc: "Notificaciones ERP" },
                      { name: "OpenAI API", desc: "Preingeniería Automatizada" }
                    ].map((integ) => (
                      <div key={integ.name} className="p-3 rounded-lg border border-border/60 bg-muted/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10.5px] font-bold text-foreground block">{integ.name}</span>
                          <span className="text-[9px] text-muted-foreground block">{integ.desc}</span>
                        </div>
                        <Badge variant="secondary" className="text-[8px] bg-secondary text-muted-foreground flex items-center gap-1">
                          <Lock className="w-2 h-2 text-muted-foreground/60" /> Inactivo
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: DOCUMENTOS & CORREOS ==================== */}
            {activeTab === "documentos" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Documentos & Notificaciones</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Plantillas y Firmas del Sistema</h3>
                  <p className="text-xs text-muted-foreground">Configure los textos por defecto para los correos automáticos de cotizaciones y encabezados de PDFs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-foreground block">Notificaciones por Correo</span>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Asunto del Correo Transaccional</label>
                        <Input value={brandingState.plantilla_correo_asunto} onChange={(e) => handleBrandingChange("plantilla_correo_asunto", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Cuerpo del Correo Transaccional</label>
                        <Textarea rows={6} value={brandingState.plantilla_correo_cuerpo} onChange={(e) => handleBrandingChange("plantilla_correo_cuerpo", e.target.value)} className="bg-background border-border text-xs text-foreground font-sans" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-bold text-foreground block">Documentos PDF Generados</span>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Texto de Encabezado PDF</label>
                        <Input value={brandingState.plantilla_pdf_encabezado} onChange={(e) => handleBrandingChange("plantilla_pdf_encabezado", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-medium">Texto de Pie de Página PDF</label>
                        <Input value={brandingState.plantilla_pdf_pie} onChange={(e) => handleBrandingChange("plantilla_pdf_pie", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                      {/* Firma */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-muted-foreground block">Firma Representante Legal</span>
                        <div className="h-16 bg-muted/10 rounded-lg flex items-center justify-center border border-border overflow-hidden relative">
                          {brandingState.firma_url ? (
                            <img src={brandingState.firma_url} alt="Firma digital" className="max-h-12 max-w-[90%] object-contain" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 font-mono">Sin Firma</span>
                          )}
                        </div>
                        <input type="file" id="upload-firma" accept="image/*" onChange={(e) => handleFileUpload(e, "firma_url")} className="hidden" />
                        <label htmlFor="upload-firma" className="w-full py-1.5 rounded bg-secondary/40 border border-border text-center text-[10px] text-foreground font-semibold hover:bg-secondary/60 cursor-pointer flex items-center justify-center gap-1 transition-all">
                          <Upload className="w-3.5 h-3.5" /> Subir Firma
                        </label>
                      </div>

                      {/* Sello */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-muted-foreground block">Sello Aprobación</span>
                        <div className="h-16 bg-muted/10 rounded-lg flex items-center justify-center border border-border overflow-hidden relative">
                          {brandingState.sello_url ? (
                            <img src={brandingState.sello_url} alt="Sello de empresa" className="max-h-12 max-w-[90%] object-contain" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 font-mono">Sin Sello</span>
                          )}
                        </div>
                        <input type="file" id="upload-sello" accept="image/*" onChange={(e) => handleFileUpload(e, "sello_url")} className="hidden" />
                        <label htmlFor="upload-sello" className="w-full py-1.5 rounded bg-secondary/40 border border-border text-center text-[10px] text-foreground font-semibold hover:bg-secondary/60 cursor-pointer flex items-center justify-center gap-1 transition-all">
                          <Upload className="w-3.5 h-3.5" /> Subir Sello
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: VERSIONES ==================== */}
            {activeTab === "versiones" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Control de Snapshots del Sistema</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Historial de Versiones e Integración</h3>
                  <p className="text-xs text-muted-foreground">Revierte de forma instantánea a configuraciones legales, de marca o de localización previas.</p>
                </div>

                {historyList.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <History className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-mono">No se han registrado snapshots de configuración en este tenant.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyList.map((version) => (
                      <div key={version.id} className="p-4 rounded-xl border border-border bg-card/40 hover:border-border/80 flex items-center justify-between gap-4 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-sm bg-primary/10 text-primary text-[10px] font-bold font-mono">
                              Snap-V{version.version_number}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(version.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-foreground">{version.description}</p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: version.config_values.color_primario }} />
                            <span className="text-[9px] text-muted-foreground font-mono">{version.config_values.razon_social || "Sin Razón Social"} · ERP: {version.config_values.nombre_erp}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(version.id)}
                          disabled={isSubmitting}
                          className="px-3.5 py-1.5 rounded-lg border border-primary/30 hover:border-primary text-primary hover:text-primary/80 text-[10px] font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB: USUARIOS ==================== */}
            {activeTab === "usuarios" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Gestión de Seguridad y Roles</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Usuarios, Roles y Permisos (RBAC)</h3>
                  <p className="text-xs text-muted-foreground">Políticas de acceso para el personal interno del ERP y clientes asociados.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                    <span className="text-xs font-bold text-foreground block">Políticas 2FA</span>
                    <p className="text-[11px] text-muted-foreground">Doble factor de autenticación requerido para administradores y compras.</p>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[9px] font-mono">Activo (AMCA-Policy)</Badge>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                    <span className="text-xs font-bold text-foreground block">Políticas de Contraseña</span>
                    <p className="text-[11px] text-muted-foreground">Mínimo 12 caracteres, alfanumérico e historial de cambio obligatorio.</p>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[9px] font-mono">Activo</Badge>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                    <span className="text-xs font-bold text-foreground block">Control de Sesiones</span>
                    <p className="text-[11px] text-muted-foreground">Expiración automática por inactividad a los 15 minutos en módulos.</p>
                    <Badge variant="secondary" className="bg-secondary text-muted-foreground text-[9px] font-mono">15 Minutos</Badge>
                  </div>
                </div>

                {/* Simulated list of users */}
                <div className="border-t border-border pt-5 space-y-3">
                  <span className="text-xs font-bold text-foreground block">Personal con Roles Activos</span>
                  <div className="space-y-2">
                    {[
                      { name: "Ing. Carlos Mendoza", email: "c.mendoza@ventitech.co", role: "SuperAdministrador", active: true },
                      { name: "Dra. Sandra Gómez", email: "s.gomez@ventitech.co", role: "Ingeniería / Compras", active: true },
                      { name: "Andrés Silva (Taller)", email: "a.silva@ventitech.co", role: "Producción / Jobs", active: true }
                    ].map((user) => (
                      <div key={user.email} className="p-3 rounded-lg bg-muted/10 border border-border flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground">{user.name}</span>
                          <span className="text-muted-foreground block font-mono text-[10px]">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-[9px] font-mono bg-secondary text-muted-foreground">{user.role}</Badge>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
