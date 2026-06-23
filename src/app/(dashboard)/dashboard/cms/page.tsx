"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Globe,
  Package,
  Layers,
  Award,
  HelpCircle,
  Video,
  Grid,
  FileArchive,
  BookOpen,
  Search,
  Tag,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Palette,
  Upload,
  RefreshCw,
  History,
  Building,
  Layout,
  ExternalLink,
  ShieldCheck,
  FileText,
  Image as ImageIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { getTenantBranding, saveTenantBranding } from "@/app/actions/branding";
import { BrandingConfig, getBrandingDefaults } from "@/utils/branding-defaults";
import { getIndustrialCatalog, CatalogCategory, saveProduct, deleteProduct, saveCategory, deleteCategory } from "@/app/actions/catalog";

type TabId = "hero" | "sectores" | "cases" | "catalog" | "media" | "blog" | "seo" | "footer";

interface SectorItem {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface SuccessCase {
  id: string;
  clientName: string;
  industry: string;
  cfmSaved: number;
  description: string;
  results: string;
  productsUsed: string;
}

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  status: "BORRADOR" | "PUBLICADO";
  publishedAt: string;
}

interface MediaFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

// Expandable tree node for catalog
interface CatalogNodeProps {
  label: string;
  code: string;
  children?: React.ReactNode;
  level?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

function CatalogNode({ label, code, children, level = 0, onEdit, onDelete }: CatalogNodeProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <div
        className={`flex items-center justify-between group hover:bg-accent/40 rounded-lg px-2 py-1.5 cursor-pointer transition-colors`}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1" onClick={() => setOpen(!open)}>
          {children ? (
            open ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <div className="w-3 h-3 shrink-0" />
          )}
          <span className="text-xs font-mono text-primary shrink-0">{code}</span>
          <span className="text-xs text-foreground truncate">{label}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1 rounded text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {open && children && <div>{children}</div>}
    </div>
  );
}

export default function CmsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [activeTab, setActiveTab] = React.useState<TabId>("hero");
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // ===== BRANDING/HERO STATE =====
  const [brandingState, setBrandingState] = React.useState<BrandingConfig>(getBrandingDefaults(tenantParam));
  const [isBrandingLoading, setIsBrandingLoading] = React.useState(true);
  const [isBrandingSubmitting, setIsBrandingSubmitting] = React.useState(false);

  // Additional mock settings for detailed Hero settings
  const [heroLoop, setHeroLoop] = React.useState(true);
  const [heroMute, setHeroMute] = React.useState(true);
  const [heroAutoplay, setHeroAutoplay] = React.useState(true);
  const [heroVideoSpeed, setHeroVideoSpeed] = React.useState("1.0");
  const [heroButton1Text, setHeroButton1Text] = React.useState("Solicitar Preingeniería");
  const [heroButton2Text, setHeroButton2Text] = React.useState("Ver Catálogo Industrial");

  // ===== SECTORES STATE =====
  const [sectores, setSectores] = React.useState<SectorItem[]>([
    { id: "sec-1", name: "Minero & Súper Extracción", slug: "mineria", title: "Ventilación Subterránea B2B", description: "Inyección controlada de aire limpio para frentes de explotación bajo normas internacionales.", icon: "Activity", color: "#F59E0B" },
    { id: "sec-2", name: "Alimentos & Acero Inoxidable", slug: "alimentos", title: "Extracción Sanitaria y Control de Humedad", description: "Extractores de alta eficiencia con balanceo ISO G2.5 para salas limpias.", icon: "Shield", color: "#10B981" }
  ]);
  const [editingSector, setEditingSector] = React.useState<SectorItem | null>(null);

  // ===== CASOS DE ÉXITO STATE =====
  const [cases, setCases] = React.useState<SuccessCase[]>([
    { id: "case-1", clientName: "Fundición Andina S.A.", industry: "Metalúrgica", cfmSaved: 45000, description: "Reducción del 35% de material particulado y calor en hornos de fundición de chatarra.", results: "35% Menos calor y 100% de cumplimiento ambiental.", productsUsed: "Extractor Axial VT-7500 CFM" },
    { id: "case-2", clientName: "Alimentos del Centro", industry: "Procesado de Harinas", cfmSaved: 15000, description: "Control de humedad y polvo orgánico en silos con extractores tipo hongo de acero inoxidable 304.", results: "Humedad reducida al 12% y cero acumulación de material combustible.", productsUsed: "Extractor Tipo Hongo HG-5000" }
  ]);
  const [editingCase, setEditingCase] = React.useState<SuccessCase | null>(null);

  // ===== CATALOG STATE =====
  const [catalog, setCatalog] = React.useState<CatalogCategory[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<{
    id?: string; productCode: string; name: string; description: string; status: string; seriesId: string;
    specifications: Record<string, string>;
    price?: number;
    stepUrl?: string;
    dwgUrl?: string;
  } | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<{
    id?: string; categoryCode: string; name: string; description: string;
  } | null>(null);
  const [newSpecKey, setNewSpecKey] = React.useState("");
  const [newSpecVal, setNewSpecVal] = React.useState("");
  const [isSavingProduct, setIsSavingProduct] = React.useState(false);

  // ===== MEDIA LIBRARY STATE =====
  const [mediaList, setMediaList] = React.useState<MediaFile[]>([
    { id: "m-1", name: "video_hero.mp4", size: "18.4 MB", type: "video/mp4", url: "/video_hero.mp4" },
    { id: "m-2", name: "dossier_tecnico_2026.pdf", size: "4.2 MB", type: "application/pdf", url: "/dossier_tecnico_2026.pdf" },
    { id: "m-3", name: "plano_extractor_vt7500.dwg", size: "1.8 MB", type: "image/vnd.dwg", url: "/plano_extractor_vt7500.dwg" }
  ]);

  // ===== BLOG STATE =====
  const [blogArticles, setBlogArticles] = React.useState<BlogArticle[]>([
    { id: "art-1", title: "Normativa AMCA en Ventiladores Industriales", slug: "normativa-amca", category: "Ingeniería", author: "Ing. Carlos Mendoza", status: "PUBLICADO", publishedAt: "2026-06-15" },
    { id: "art-2", title: "Cálculo de Renovaciones de Aire por Minuto", slug: "calculo-renovaciones-aire", category: "Cálculo", author: "Dr. Sandra Gómez", status: "BORRADOR", publishedAt: "--" }
  ]);
  const [editingArticle, setEditingArticle] = React.useState<BlogArticle | null>(null);

  // ===== SEO STATE =====
  const [metaTitle, setMetaTitle] = React.useState("Sistemas de Ventilación Industrial Premium");
  const [metaDescription, setMetaDescription] = React.useState("Diseño, fabricación e instalación de sistemas industriales de ventilación B2B.");
  const [metaKeywords, setMetaKeywords] = React.useState("ventilación, extractor axial, extractor hongo, AMCA");

  // ===== FOOTER STATE =====
  const [copyrightText, setCopyrightText] = React.useState("© 2026 VentiTech. Todos los derechos reservados.");
  const [socialLinkedin, setSocialLinkedin] = React.useState("https://linkedin.com/company/ventitech");
  const [socialYoutube, setSocialYoutube] = React.useState("https://youtube.com/c/ventitech");

  React.useEffect(() => {
    async function loadBranding() {
      try {
        const data = await getTenantBranding(tenantParam);
        setBrandingState(data);
      } catch (err) {
        console.error("Error loading branding in CMS:", err);
      } finally {
        setIsBrandingLoading(false);
      }
    }
    loadBranding();
  }, [tenantParam]);

  const handleBrandingChange = (key: keyof BrandingConfig, val: string) => {
    setBrandingState(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveBranding = async () => {
    setIsBrandingSubmitting(true);
    try {
      const res = await saveTenantBranding(tenantParam, brandingState, "Actualización del Hero de la Landing Page vía CMS");
      if (!res.success) throw new Error(res.error || "No se pudo guardar");
      
      const cacheKey = `tenant_config_${tenantParam || "default"}`;
      localStorage.setItem(cacheKey, JSON.stringify(brandingState));

      triggerSuccess("Configuración del Hero de la Landing Page pública publicada con éxito.");
    } catch (err: any) {
      alert(`Error al guardar: ${err.message || err}`);
    } finally {
      setIsBrandingSubmitting(false);
    }
  };

  const loadCatalog = React.useCallback(async () => {
    setIsCatalogLoading(true);
    try {
      const data = await getIndustrialCatalog(tenantParam);
      setCatalog(data);
    } catch (err) {
      console.error("Error loading catalog:", err);
    } finally {
      setIsCatalogLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    if (activeTab === "catalog") {
      loadCatalog();
    }
  }, [activeTab, loadCatalog]);

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      const res = await saveProduct(tenantParam, editingProduct);
      if (!res.success) throw new Error(res.error || "Error al guardar producto");
      await loadCatalog();
      setEditingProduct(null);
      triggerSuccess("Producto guardado exitosamente en el catálogo comercial.");
    } catch (err: any) {
      alert(`Error: ${err.message || err}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await deleteProduct(tenantParam, productId);
    if (res.success) {
      await loadCatalog();
      triggerSuccess("Producto eliminado del catálogo.");
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    const res = await saveCategory(tenantParam, editingCategory);
    if (res.success) {
      await loadCatalog();
      setEditingCategory(null);
      triggerSuccess("Categoría de catálogo guardada con éxito.");
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("¿Eliminar esta categoría y todos sus productos?")) return;
    const res = await deleteCategory(tenantParam, categoryId);
    if (res.success) {
      await loadCatalog();
      triggerSuccess("Categoría eliminada.");
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "hero", label: "Landing / Hero", icon: Globe },
    { id: "sectores", label: "Sectores", icon: Grid },
    { id: "cases", label: "Casos de Éxito", icon: Award },
    { id: "catalog", label: "Productos & Catálogo", icon: Package },
    { id: "media", label: "Biblioteca Multimedia", icon: FileArchive },
    { id: "blog", label: "Blog Corporativo", icon: BookOpen },
    { id: "seo", label: "SEO Metatags", icon: Sliders },
    { id: "footer", label: "Footer & Contacto", icon: Layout },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Gestor de Contenido (CMS)
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Portal CMS Público
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra todo el contenido público comercial expuesto en la Landing Page corporativa.
          </p>
        </div>

        {activeTab === "hero" && (
          <Button
            onClick={handleSaveBranding}
            disabled={isBrandingSubmitting || isBrandingLoading}
            className="bg-primary hover:bg-primary/90 text-white text-xs h-9 px-5 cursor-pointer shrink-0"
          >
            {isBrandingSubmitting ? (
              <><Spinner className="w-3.5 h-3.5 mr-1.5" /> Publicando...</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1.5" /> Publicar Cambios Hero</>
            )}
          </Button>
        )}

        {(activeTab === "seo" || activeTab === "footer") && (
          <Button
            onClick={() => triggerSuccess("SEO / Footer guardado con éxito.")}
            className="bg-primary hover:bg-primary/90 text-white text-xs h-9 px-5 cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> Guardar
          </Button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-semibold text-sm">Contenido Publicado</h4>
            <p className="text-xs opacity-90">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-border text-xs overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 relative -mb-[2px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
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

      {/* Tab Content */}
      <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md min-h-[520px]">

        {/* ==================== TAB: LANDING / HERO ==================== */}
        {activeTab === "hero" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {isBrandingLoading ? (
              <div className="text-center py-12 font-mono text-xs text-muted-foreground animate-pulse">Cargando Hero...</div>
            ) : (
              <>
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Portada Principal</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Configuración de Pantalla Hero</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs text-muted-foreground font-medium">Título Comercial del Hero</label>
                    <Input value={brandingState.landing_titulo} onChange={(e) => handleBrandingChange("landing_titulo", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs text-muted-foreground font-medium">Subtítulo / Propuesta de Valor</label>
                    <Textarea rows={3} value={brandingState.landing_subtitulo} onChange={(e) => handleBrandingChange("landing_subtitulo", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Video URL de Fondo (MP4 / Webm)</label>
                    <Input value={brandingState.landing_video_url} onChange={(e) => handleBrandingChange("landing_video_url", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">URL Dossier Corporativo B2B (Ficha / Brochure)</label>
                    <Input value={brandingState.dossier_url} onChange={(e) => handleBrandingChange("dossier_url", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>

                  {/* Multimedia behavior */}
                  <div className="md:col-span-2 border-t border-border pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/10 rounded-lg border border-border flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">Loop Video</span>
                      <input type="checkbox" checked={heroLoop} onChange={(e) => setHeroLoop(e.target.checked)} className="accent-primary" />
                    </div>
                    <div className="p-3 bg-muted/10 rounded-lg border border-border flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">Silenciar Video</span>
                      <input type="checkbox" checked={heroMute} onChange={(e) => setHeroMute(e.target.checked)} className="accent-primary" />
                    </div>
                    <div className="p-3 bg-muted/10 rounded-lg border border-border flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">Autoplay</span>
                      <input type="checkbox" checked={heroAutoplay} onChange={(e) => setHeroAutoplay(e.target.checked)} className="accent-primary" />
                    </div>
                    <div className="p-3 bg-muted/10 rounded-lg border border-border flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium">Velocidad</span>
                      <select value={heroVideoSpeed} onChange={(e) => setHeroVideoSpeed(e.target.value)} className="bg-background border-border text-[10px] text-foreground rounded px-1">
                        <option value="0.75">0.75x</option>
                        <option value="1.0">1.0x</option>
                        <option value="1.25">1.25x</option>
                      </select>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="md:col-span-2 border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Texto Botón Primario</label>
                      <Input value={heroButton1Text} onChange={(e) => setHeroButton1Text(e.target.value)} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Texto Botón Secundario</label>
                      <Input value={heroButton2Text} onChange={(e) => setHeroButton2Text(e.target.value)} className="bg-background border-border text-xs text-foreground" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== TAB: SECTORES ==================== */}
        {activeTab === "sectores" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Sectores del Negocio</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Sectores Industriales Cubiertos</h3>
                <p className="text-xs text-muted-foreground">Muestre cómo resuelve los problemas específicos de ventilación en cada sector.</p>
              </div>
              <Button onClick={() => { const newItem: SectorItem = { id: `sec-${Date.now()}`, name: "Nuevo Sector B2B", slug: "nuevo-sector", title: "Foco de Soluciones", description: "Describa el beneficio principal.", icon: "Activity", color: "#3B82F6" }; setSectores([...sectores, newItem]); setEditingSector(newItem); }} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Sector
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {sectores.map(item => (
                  <div key={item.id} onClick={() => setEditingSector(item)} className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${editingSector?.id === item.id ? "bg-accent/40 border-primary/40" : "bg-card/40 border-border hover:bg-accent/20"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">{item.name}</h4>
                      <Badge variant="secondary" className="text-[8px] font-mono uppercase" style={{ color: item.color, borderColor: `${item.color}20` }}>{item.slug}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-muted/10 border border-border rounded-xl p-6">
                {editingSector ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Sector Comercial</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Nombre Comercial</label>
                        <Input value={editingSector.name} onChange={(e) => setEditingSector({...editingSector, name: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Slug URL</label>
                        <Input value={editingSector.slug} onChange={(e) => setEditingSector({...editingSector, slug: e.target.value})} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Título de Solución</label>
                      <Input value={editingSector.title} onChange={(e) => setEditingSector({...editingSector, title: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Descripción Larga del Sector</label>
                      <Textarea rows={4} value={editingSector.description} onChange={(e) => setEditingSector({...editingSector, description: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Color Sector</label>
                        <div className="flex gap-2">
                          <input type="color" value={editingSector.color} onChange={(e) => setEditingSector({...editingSector, color: e.target.value})} className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer" />
                          <Input value={editingSector.color} onChange={(e) => setEditingSector({...editingSector, color: e.target.value})} className="bg-background border-border text-xs font-mono text-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <Button onClick={() => { setSectores(prev => prev.filter(s => s.id !== editingSector.id)); setEditingSector(null); triggerSuccess("Sector eliminado."); }} className="bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 text-xs h-8 px-3 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => { setSectores(prev => prev.map(s => s.id === editingSector.id ? editingSector : s)); setEditingSector(null); triggerSuccess("Sector guardado."); }} className="bg-primary hover:bg-primary/90 text-white text-xs h-8 px-4 cursor-pointer">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar Sector
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs font-mono">
                    <Grid className="w-8 h-8 text-muted-foreground/60 mb-1" /> Selecciona un sector comercial para editar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: CASOS DE ÉXITO ==================== */}
        {activeTab === "cases" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Case Studies</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Casos de Éxito y Proyectos B2B</h3>
                <p className="text-xs text-muted-foreground">Muestre métricas de ahorro CFM reales para convencer a clientes B2B.</p>
              </div>
              <Button onClick={() => { const newItem: SuccessCase = { id: `case-${Date.now()}`, clientName: "Nuevo Cliente Industrial", industry: "Manufactura", cfmSaved: 10000, description: "Describa brevemente la solución.", results: "Métricas obtenidas", productsUsed: "Extractores Axiales" }; setCases([...cases, newItem]); setEditingCase(newItem); }} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Caso
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {cases.map(item => (
                  <div key={item.id} onClick={() => setEditingCase(item)} className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${editingCase?.id === item.id ? "bg-accent/40 border-primary/40" : "bg-card/40 border-border hover:bg-accent/20"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">{item.clientName}</h4>
                      <Badge variant="secondary" className="text-[8px] font-mono">{item.industry}</Badge>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Caudal Optimizado:</span>
                      <span className="text-emerald-400 font-bold">+{item.cfmSaved.toLocaleString()} CFM</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/10 border border-border rounded-xl p-6">
                {editingCase ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Caso B2B</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Cliente B2B</label>
                        <Input value={editingCase.clientName} onChange={(e) => setEditingCase({...editingCase, clientName: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Sector Industrial</label>
                        <Input value={editingCase.industry} onChange={(e) => setEditingCase({...editingCase, industry: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Caudal Optimizado (CFM)</label>
                      <Input type="number" value={editingCase.cfmSaved} onChange={(e) => setEditingCase({...editingCase, cfmSaved: Number(e.target.value)})} className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Métricas & Resultados de Ahorro</label>
                      <Input value={editingCase.results} onChange={(e) => setEditingCase({...editingCase, results: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Equipos de Catálogo Utilizados</label>
                      <Input value={editingCase.productsUsed} onChange={(e) => setEditingCase({...editingCase, productsUsed: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Descripción del Caso</label>
                      <Textarea rows={3} value={editingCase.description} onChange={(e) => setEditingCase({...editingCase, description: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <Button onClick={() => { setCases(prev => prev.filter(c => c.id !== editingCase.id)); setEditingCase(null); triggerSuccess("Caso de éxito eliminado."); }} className="bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 text-xs h-8 px-3 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => { setCases(prev => prev.map(c => c.id === editingCase.id ? editingCase : c)); setEditingCase(null); triggerSuccess("Caso de Éxito guardado."); }} className="bg-primary hover:bg-primary/90 text-white text-xs h-8 px-4 cursor-pointer">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar Caso
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs font-mono">
                    <Award className="w-8 h-8 text-muted-foreground/60 mb-1" /> Selecciona un Caso de Éxito para editar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: CATÁLOGO & PRODUCTOS ==================== */}
        {activeTab === "catalog" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Catálogo Comercial</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Gestión de Catálogo e Ingeniería</h3>
                <p className="text-xs text-muted-foreground">Configure la jerarquía comercial pública y cargue archivos STEP/DWG técnicos.</p>
              </div>
              <Button onClick={() => setEditingCategory({ categoryCode: "", name: "", description: "" })} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Categoría
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Tree */}
              <div className="lg:col-span-2 border border-border rounded-xl p-2 bg-muted/10 min-h-[400px]">
                {isCatalogLoading ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-mono animate-pulse">Cargando catálogo...</div>
                ) : catalog.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                    <Package className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                    Sin categorías en Supabase.
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {catalog.map(cat => (
                      <CatalogNode
                        key={cat.id}
                        label={cat.name}
                        code={cat.categoryCode}
                        level={0}
                        onEdit={() => setEditingCategory({ id: cat.id, categoryCode: cat.categoryCode, name: cat.name, description: cat.description })}
                        onDelete={() => handleDeleteCategory(cat.id)}
                      >
                        {cat.subcategories.map(sub => (
                          <CatalogNode key={sub.id} label={sub.name} code={sub.subcategoryCode} level={1}>
                            {sub.families.map(fam => (
                              <CatalogNode key={fam.id} label={fam.name} code={fam.familyCode} level={2}>
                                {fam.series.map(ser => (
                                  <CatalogNode key={ser.id} label={ser.name} code={ser.seriesCode} level={3}>
                                    {ser.products.map(prod => (
                                      <CatalogNode
                                        key={prod.id}
                                        label={prod.name}
                                        code={prod.productCode}
                                        level={4}
                                        onEdit={() => setEditingProduct({
                                          id: prod.id,
                                          productCode: prod.productCode,
                                          name: prod.name,
                                          description: prod.description,
                                          status: prod.status,
                                          seriesId: ser.id,
                                          specifications: prod.specifications,
                                          price: 15400000
                                        })}
                                        onDelete={() => handleDeleteProduct(prod.id)}
                                      />
                                    ))}
                                    <div className="pl-16 py-1">
                                      <button onClick={() => setEditingProduct({ productCode: "", name: "", description: "", status: "ACTIVO", seriesId: ser.id, specifications: {}, price: 15000000 })} className="text-[10px] text-primary hover:text-primary/80 font-mono flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Nuevo Producto
                                      </button>
                                    </div>
                                  </CatalogNode>
                                ))}
                              </CatalogNode>
                            ))}
                          </CatalogNode>
                        ))}
                      </CatalogNode>
                    ))}
                  </div>
                )}
              </div>

              {/* Editor Panel */}
              <div className="lg:col-span-3 border border-border rounded-xl p-6 bg-muted/10 min-h-[400px]">
                {editingProduct ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Producto</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Código SKU</label>
                        <Input value={editingProduct.productCode} onChange={(e) => setEditingProduct({...editingProduct, productCode: e.target.value})} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Precio B2B (COP)</label>
                        <Input type="number" value={editingProduct.price || 0} onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Estado</label>
                        <select value={editingProduct.status} onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="INACTIVO">INACTIVO</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Nombre del Equipo</label>
                      <Input value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Descripción Técnica Comercial</label>
                      <Textarea rows={3} value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Plano STEP (3D CAD)</label>
                        <Input value={editingProduct.stepUrl || ""} onChange={(e) => setEditingProduct({...editingProduct, stepUrl: e.target.value})} className="bg-background border-border text-[10px] text-foreground font-mono" placeholder="/cad/extractor.step" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Plano DWG (2D CAD)</label>
                        <Input value={editingProduct.dwgUrl || ""} onChange={(e) => setEditingProduct({...editingProduct, dwgUrl: e.target.value})} className="bg-background border-border text-[10px] text-foreground font-mono" placeholder="/cad/extractor.dwg" />
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted-foreground uppercase font-mono font-bold">Ficha Técnica Parámetros</label>
                      <div className="space-y-1.5">
                        {Object.entries(editingProduct.specifications).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-primary w-32 shrink-0 truncate">{key}</span>
                            <Input value={val} onChange={(e) => setEditingProduct({...editingProduct, specifications: {...editingProduct.specifications, [key]: e.target.value}})} className="bg-background border-border text-xs text-foreground h-7" />
                            <button onClick={() => { const s = {...editingProduct.specifications}; delete s[key]; setEditingProduct({...editingProduct, specifications: s}); }} className="text-destructive hover:text-destructive/80 shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Input value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} placeholder="CFM / RPM / AMCA" className="bg-background border-border text-xs text-foreground h-7 font-mono" />
                        <Input value={newSpecVal} onChange={(e) => setNewSpecVal(e.target.value)} placeholder="Valor" className="bg-background border-border text-xs text-foreground h-7" />
                        <button
                          onClick={() => { if (newSpecKey.trim()) { setEditingProduct({...editingProduct, specifications: {...editingProduct.specifications, [newSpecKey.trim()]: newSpecVal.trim()}}); setNewSpecKey(""); setNewSpecVal(""); }}}
                          className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-md px-2 h-7 text-xs shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-border">
                      <Button onClick={() => setEditingProduct(null)} className="bg-secondary/40 border border-border text-muted-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">Cancelar</Button>
                      <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="bg-primary hover:bg-primary/90 text-white text-xs h-8 cursor-pointer">
                        {isSavingProduct ? <><Spinner className="w-3 h-3 mr-1" /> Guardando...</> : <><Save className="w-3 h-3 mr-1" /> Guardar Producto</>}
                      </Button>
                    </div>
                  </div>
                ) : editingCategory ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Categoría</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Código de Categoría</label>
                        <Input value={editingCategory.categoryCode} onChange={(e) => setEditingCategory({...editingCategory, categoryCode: e.target.value})} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Nombre de Categoría</label>
                        <Input value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Descripción General</label>
                      <Textarea rows={3} value={editingCategory.description} onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <Button onClick={() => setEditingCategory(null)} className="bg-secondary/40 border border-border text-muted-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">Cancelar</Button>
                      <Button onClick={handleSaveCategory} className="bg-primary hover:bg-primary/90 text-white text-xs h-8 cursor-pointer">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar Categoría
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs font-mono">
                    <Package className="w-8 h-8 text-muted-foreground/60 mb-2" />
                    Selecciona un producto o categoría para editar en el catálogo comercial.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: BIBLIOTECA MULTIMEDIA ==================== */}
        {activeTab === "media" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Media Library</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Biblioteca de Archivos B2B</h3>
                <p className="text-xs text-muted-foreground">Almacene planos STEP, DWG, PDFs técnicos y videos de marketing.</p>
              </div>
              <Button onClick={() => { alert("Función de carga simulada. Selecciona archivos desde tu equipo local."); }} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Upload className="w-3.5 h-3.5 mr-1" /> Cargar Archivo
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaList.map((file) => (
                <div key={file.id} className="p-3.5 rounded-xl border border-border bg-muted/10 flex flex-col justify-between gap-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="h-20 bg-muted/20 rounded border border-border/60 flex items-center justify-center">
                      {file.type.includes("video") ? (
                        <Video className="w-7 h-7 text-muted-foreground/60" />
                      ) : file.type.includes("pdf") ? (
                        <FileText className="w-7 h-7 text-muted-foreground/60" />
                      ) : (
                        <FileArchive className="w-7 h-7 text-muted-foreground/60" />
                      )}
                    </div>
                    <span className="font-semibold text-foreground block truncate">{file.name}</span>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{file.size}</span>
                      <span className="uppercase">{file.type.split("/")[1]}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => alert(`Enlace copiado al portapapeles: ${file.url}`)} className="flex-grow bg-secondary/40 hover:bg-secondary/60 text-foreground text-[10px] h-7 cursor-pointer">Copiar Link</Button>
                    <button onClick={() => setMediaList(prev => prev.filter(f => f.id !== file.id))} className="px-2 py-1 rounded bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: BLOG ==================== */}
        {activeTab === "blog" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Content Marketing</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Blog Comercial y Artículos de Ingeniería</h3>
                <p className="text-xs text-muted-foreground">Publique artículos técnicos para mejorar el posicionamiento SEO orgánico.</p>
              </div>
              <Button onClick={() => { const newItem: BlogArticle = { id: `art-${Date.now()}`, title: "Nuevo Artículo Técnico", slug: "nuevo-articulo", category: "General", author: "Ingeniero Especialista", status: "BORRADOR", publishedAt: "--" }; setBlogArticles([...blogArticles, newItem]); setEditingArticle(newItem); }} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Plus className="w-3.5 h-3.5 mr-1" /> Redactar Artículo
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {blogArticles.map(art => (
                  <div key={art.id} onClick={() => setEditingArticle(art)} className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${editingArticle?.id === art.id ? "bg-accent/40 border-primary/40" : "bg-card/40 border-border hover:bg-accent/20"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground line-clamp-1">{art.title}</h4>
                      <Badge variant="secondary" className={`text-[8px] font-mono ${art.status === "PUBLICADO" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse" : "bg-secondary text-muted-foreground"}`}>{art.status}</Badge>
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                      <span>Autor: {art.author}</span>
                      <span>Publicado: {art.publishedAt}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/10 border border-border rounded-xl p-6">
                {editingArticle ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Redacción</div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Título del Artículo</label>
                      <Input value={editingArticle.title} onChange={(e) => setEditingArticle({...editingArticle, title: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Categoría</label>
                        <Input value={editingArticle.category} onChange={(e) => setEditingArticle({...editingArticle, category: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Estado publicación</label>
                        <select value={editingArticle.status} onChange={(e) => setEditingArticle({...editingArticle, status: e.target.value as any})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                          <option value="BORRADOR">BORRADOR</option>
                          <option value="PUBLICADO">PUBLICADO</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Contenido Markdown</label>
                      <Textarea rows={6} defaultValue="# Introducción a la ingeniería de fluidos..." className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <Button onClick={() => { setBlogArticles(prev => prev.filter(a => a.id !== editingArticle.id)); setEditingArticle(null); triggerSuccess("Artículo borrado."); }} className="bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 text-xs h-8 px-3 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => { setBlogArticles(prev => prev.map(a => a.id === editingArticle.id ? {...editingArticle, publishedAt: editingArticle.status === "PUBLICADO" ? new Date().toLocaleDateString() : "--"} : a)); setEditingArticle(null); triggerSuccess("Artículo de blog guardado."); }} className="bg-primary hover:bg-primary/90 text-white text-xs h-8 px-4 cursor-pointer">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar Artículo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs font-mono">
                    <BookOpen className="w-8 h-8 text-muted-foreground/60 mb-1" /> Selecciona un artículo para editar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: SEO ==================== */}
        {activeTab === "seo" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Search Engine Optimization</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Configuración SEO Global de la Landing</h3>
              <p className="text-xs text-muted-foreground">Configure los metatags que leerán los motores de búsqueda para indexar la landing page.</p>
            </div>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Meta Title Principal</label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="bg-background border-border text-xs text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Meta Description</label>
                <Textarea rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="bg-background border-border text-xs text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Keywords (separadas por comas)</label>
                <Input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-1">
                <span className="text-[10px] font-bold font-mono text-foreground uppercase flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> SEO Dinámico Activo</span>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Los buscadores indexan automáticamente esta información en tiempo real a través de los metadatos dinámicos generados en la raíz del servidor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: FOOTER & CONTACTO ==================== */}
        {activeTab === "footer" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Footer Columns</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Información de Contacto y Enlaces del Footer</h3>
              <p className="text-xs text-muted-foreground">Configure los links y textos informativos del pie de página público.</p>
            </div>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Texto de Copyright (Pie de página)</label>
                <Input value={copyrightText} onChange={(e) => setCopyrightText(e.target.value)} className="bg-background border-border text-xs text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Canal de LinkedIn Corporativo</label>
                <Input value={socialLinkedin} onChange={(e) => setSocialLinkedin(e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Canal de YouTube Corporativo</label>
                <Input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
