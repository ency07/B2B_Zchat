"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  Thermometer,
  Snowflake,
  AlertTriangle,
  Wind,
  FileCheck,
  Eye,
  Activity,
  Database,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

import { getLeads, updateLeadStatus, LeadRow } from "@/app/actions/leads-erp";

// ─────────────────────────────────────────────────────────────────────────────
// Configuraciones de Estilo
// ─────────────────────────────────────────────────────────────────────────────
const riskConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  CALIENTE: { label: "Caliente",  icon: Flame,         className: "text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/10" },
  TIBIO:    { label: "Tibio",     icon: Thermometer,   className: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10" },
  FRIO:     { label: "Frío",      icon: Snowflake,     className: "text-primary border-primary/20 bg-primary/10" },
  SPAM:     { label: "SPAM",      icon: AlertTriangle, className: "text-muted-foreground border-border bg-accent/40" },
};

const statusConfig: Record<string, { label: string; variantStyle: string }> = {
  NUEVO:          { label: "Nuevo",          variantStyle: "border-border bg-accent text-muted-foreground" },
  EN_SEGUIMIENTO: { label: "En Seguimiento", variantStyle: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-450" },
  CALIFICADO:     { label: "Calificado",     variantStyle: "border-primary/20 bg-primary/10 text-primary" },
  RECHAZADO:      { label: "Rechazado",      variantStyle: "border-destructive/20 bg-destructive/10 text-destructive" },
  CONVERTIDO:     { label: "Convertido",     variantStyle: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" },
};

function formatCop(val: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
}

function formatUsd(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// Página Principal
// ─────────────────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [leads, setLeads] = React.useState<LeadRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedLead, setSelectedLead] = React.useState<LeadRow | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const loadLeads = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads(tenantParam);
      setLeads(data);
    } catch (err: any) {
      console.error("Error cargando leads:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => { loadLeads(); }, [loadLeads]);

  const openDetail = (lead: LeadRow) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  // ─── Columnas ──────────────────────────────────────────────────────────────
  const columns: ColumnDef<LeadRow>[] = [
    {
      accessorKey: "lead_code",
      header: "Código",
      cell: ({ row }) => (
        <code className="text-[11px] font-mono text-foreground/80">{row.getValue("lead_code")}</code>
      ),
    },
    {
      id: "empresa",
      header: "Empresa / Contacto",
      filterFn: (row, _id, filterValue) => {
        const val = filterValue.toLowerCase();
        const empresa = row.original.client?.legal_name?.toLowerCase() ?? "";
        const code = row.original.lead_code?.toLowerCase() ?? "";
        return empresa.includes(val) || code.includes(val);
      },
      cell: ({ row }) => {
        const lead = row.original;
        const contactName = lead.contact
          ? `${lead.contact.first_name} ${lead.contact.last_name}`.trim()
          : "—";
        return (
          <div>
            <div className="font-semibold text-xs text-foreground truncate max-w-[180px]">
              {lead.client?.legal_name ?? "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">{contactName}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "risk_level",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Temperatura <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => {
        const level = row.getValue("risk_level") as string;
        const cfg = riskConfig[level] ?? riskConfig.FRIO;
        const Icon = cfg.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${cfg.className}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        );
      },
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Score <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => {
        const score = row.getValue("score") as number;
        const color = score >= 70 ? "text-red-500" : score >= 40 ? "text-amber-500" : "text-primary";
        return (
          <span className={`font-bold text-xs font-mono ${color}`}>
            {score}<span className="text-[10px] font-normal text-muted-foreground">/100</span>
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const st = row.getValue("status") as string;
        const cfg = statusConfig[st] ?? { label: st, variantStyle: "border-border bg-accent text-muted-foreground" };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono border ${cfg.variantStyle}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: "diagnostico",
      header: "Diagnóstico",
      cell: ({ row }) => {
        const diag = row.original.diagnostic;
        if (!diag) return <span className="text-xs text-muted-foreground/60 italic">Pendiente</span>;
        return (
          <div className="text-xs">
            <div className="font-mono font-semibold text-foreground">{diag.diagnostic_code}</div>
            <div className="text-muted-foreground font-mono text-[10px]">
              {diag.cfm_category} · {diag.calculated_cfm?.toLocaleString() ?? "—"} CFM
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Fecha",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={e => { e.stopPropagation(); openDetail(row.original); }}
          className="h-7 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const calientes = leads.filter(l => l.risk_level === "CALIENTE").length;
  const tibios    = leads.filter(l => l.risk_level === "TIBIO").length;
  const frios     = leads.filter(l => l.risk_level === "FRIO").length;
  const nuevos    = leads.filter(l => l.status === "NUEVO").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo CRM VentiTech
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Pipeline de Leads
          </h1>
          <p className="text-xs text-muted-foreground">
            Calificación y asignación de prospectos capturados desde la calculadora y el wizard técnico.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Flame className="w-4 h-4 text-red-500" />}       label="Calientes"      value={calientes} sub="Prioridad comercial alta"   color="border-border bg-card text-red-500" />
        <KpiCard icon={<Thermometer className="w-4 h-4 text-amber-500" />} label="Tibios"        value={tibios}    sub="Seguimiento comercial activo" color="border-border bg-card text-amber-600 dark:text-amber-400" />
        <KpiCard icon={<Snowflake className="w-4 h-4 text-primary" />}   label="Fríos"          value={frios}     sub="Nurturing / Sin urgencia"     color="border-border bg-card text-primary" />
        <KpiCard icon={<Activity className="w-4 h-4 text-muted-foreground" />}   label="Sin Gestionar"  value={nuevos}    sub="Nuevos en bandeja"      color="border-border bg-card text-foreground" />
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-border bg-card/45 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-border bg-accent/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa o código..."
              className="pl-8 h-8 text-xs bg-background border-border text-foreground rounded-md shadow-inner"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest font-bold">
            {table.getFilteredRowModel().rows.length} de {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 bg-card/20">
            <Spinner className="w-6 h-6 text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground font-mono">
            <Wind className="w-10 h-10 opacity-20 text-primary" />
            <p className="text-xs font-semibold">// No hay leads registrados en el tenant.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(hg => (
                    <TableRow key={hg.id} className="border-b border-border bg-accent/40 hover:bg-accent/40">
                      {hg.headers.map(header => (
                        <TableHead key={header.id} className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground py-3">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-xs text-muted-foreground font-mono py-8 uppercase tracking-widest">
                        // No se encontraron resultados para la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-accent/30 cursor-pointer border-b border-border/45 transition-colors"
                        onClick={() => openDetail(row.original)}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} className="py-2 px-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground font-mono bg-accent/10">
              <span>
                Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Slide-out Sheet Panel for Lead Details */}
      <LeadDetailSheet
        lead={selectedLead}
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onRefresh={loadLeads}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub: string; color: string;
}) {
  return (
    <div className={`p-5 rounded-lg border ${color} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_4px_12px_rgba(0,0,0,0.05)] hover:border-border/80 transition-colors`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground font-mono tracking-tight">{value}</div>
      <span className="text-[10px] text-muted-foreground mt-1.5 block font-sans">{sub}</span>
    </div>
  );
}

function LeadDetailSheet({ lead, open, onClose, onRefresh }: {
  lead: LeadRow | null; open: boolean; onClose: () => void; onRefresh: () => void;
}) {
  const [updating, setUpdating] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"contact" | "hvac" | "audit">("contact");

  if (!lead) return null;

  const cfg = riskConfig[lead.risk_level] ?? riskConfig.FRIO;
  const Icon = cfg.icon;
  const contactName = lead.contact
    ? `${lead.contact.first_name} ${lead.contact.last_name}`.trim()
    : "—";
  const diag = lead.diagnostic;

  const handleStatusChange = async (status: "NUEVO" | "EN_SEGUIMIENTO" | "CALIFICADO" | "RECHAZADO" | "CONVERTIDO") => {
    setUpdating(true);
    try {
      await updateLeadStatus(lead.id, status);
      await onRefresh();
      onClose();
    } catch (err) {
      console.error("Error actualizando lead:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-xl backdrop-blur-md">
        <div className="flex flex-col h-full bg-card">
          
          {/* Header */}
          <div className="p-8 border-b border-border space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Ficha de Prospecto CRM</span>
                <h3 className="text-base font-semibold text-foreground tracking-tight leading-tight">{lead.client?.legal_name || "Prospecto Comercial"}</h3>
                <code className="text-[9px] font-mono text-muted-foreground block">Código: {lead.lead_code}</code>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${cfg.className}`}>
                  <Icon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="p-3.5 rounded-lg border border-border bg-accent/20 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider block">Score de Priorización B2B</span>
                <span className="text-xl font-bold text-foreground font-mono mt-0.5">{lead.score}<span className="text-xs font-normal text-muted-foreground">/100</span></span>
              </div>
              <div className="flex-1 max-w-[200px] h-1.5 bg-background rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full rounded-full ${lead.score >= 70 ? "bg-red-500" : lead.score >= 40 ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${lead.score}%` }}
                />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border text-xs pt-2 font-mono uppercase tracking-wider text-[10px]">
              {[
                { id: "contact", label: "Contacto B2B" },
                { id: "hvac", label: "Cálculos HVAC" },
                { id: "audit", label: "Log de Auditoría" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2.5 px-4 font-medium transition-colors border-b-2 relative -mb-[2px] cursor-pointer ${
                    activeTab === tab.id 
                      ? "border-primary text-foreground" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-8 flex-1 space-y-6">

            {/* TAB: CONTACTO B2B */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-border bg-accent/20 space-y-3 shadow-xs">
                  <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Información de Cuenta</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Razón Social</span>
                      <span className="text-foreground font-semibold block mt-1">{lead.client?.legal_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Ciudad</span>
                      <span className="text-foreground block mt-1">{lead.client?.city || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-accent/20 space-y-3 shadow-xs">
                  <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Representante Técnico</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Nombre</span>
                      <span className="text-foreground block mt-1">{contactName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Cargo Declarado</span>
                      <span className="text-foreground block mt-1 font-mono text-[11px]">{lead.contact?.phone ? lead.contact?.email ? "MQL Calificado" : "Web Contact" : "System User"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Email Corporativo</span>
                      <span className="text-foreground block mt-1 font-mono">{lead.contact?.email || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Teléfono Móvil</span>
                      <span className="text-foreground block mt-1 font-mono">{lead.contact?.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Pipeline */}
                <div className="p-4 rounded-lg border border-border bg-accent/20 space-y-4 shadow-xs">
                  <div>
                    <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Avance de Estado Comercial</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">Gobernado por la matriz de estados. Defina la calificación de preingeniería:</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(statusConfig) as [string, any][]).map(([key, scfg]) => (
                      <Button
                        key={key}
                        onClick={() => handleStatusChange(key as any)}
                        disabled={updating || lead.status === key}
                        className={`text-[9px] h-7 px-2.5 rounded border transition-colors cursor-pointer font-mono uppercase tracking-wider ${
                          lead.status === key
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                            : "bg-card border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {scfg.label}
                      </Button>
                    ))}
                  </div>

                  {lead.status === "CALIFICADO" && (
                    <div className="p-3 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 text-[10px] leading-relaxed flex items-start gap-2 font-mono">
                      <FileCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        // LEAD CALIFICADO. Se habilita la ficha de Requerimiento en el ERP para procesar CFD.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: CÁLCULOS HVAC */}
            {activeTab === "hvac" && (
              <div className="space-y-6">
                {diag ? (
                  <>
                    <div className="p-4 rounded-lg border border-border bg-accent/20 space-y-4 shadow-xs">
                      <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Parámetros del Motor de Ingeniería</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-muted-foreground font-sans block">Dimensiones de la Nave</span>
                          <span className="text-foreground block mt-1 font-bold">
                            {diag.dimensions?.length || 0}m x {diag.dimensions?.width || 0}m x {diag.dimensions?.height || 0}m
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-sans block">Volumen Calculado</span>
                          <span className="text-foreground block mt-1 font-bold">{diag.calculated_volume?.toLocaleString()} m³</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-sans block">Caudal Volumétrico</span>
                          <span className="text-primary font-bold block mt-1 text-sm">{diag.calculated_cfm?.toLocaleString()} CFM</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-sans block">Clasificación</span>
                          <span className="text-foreground block mt-1 font-bold">{diag.cfm_category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-accent/20 space-y-4 shadow-xs">
                      <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Rango de Inversión Sugerido (Motor de Precios)</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-muted-foreground font-sans block">Desglose COP (Rango)</span>
                          <span className="text-emerald-600 dark:text-emerald-450 font-bold block mt-1">
                            {formatCop(diag.estimated_price_min_cop)} - {formatCop(diag.estimated_price_max_cop)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-sans block">Equivalencia USD (Tasa 4,000)</span>
                          <span className="text-primary font-bold block mt-1">
                            {formatUsd(diag.estimated_price_min_cop / 4000)} - {formatUsd(diag.estimated_price_max_cop / 4000)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {diag.materials_recommendation && (
                      <div className="p-4 rounded-lg border border-primary/20 bg-primary/10 text-primary text-xs leading-relaxed font-mono">
                        <span className="font-bold">// Directiva técnica de materiales:</span>{" "}
                        {diag.materials_recommendation}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground font-mono text-xs border border-border bg-accent/10 rounded-lg">
                    // No se adjuntó reporte de preingeniería a este lead.
                  </div>
                )}
              </div>
            )}

            {/* TAB: LOG DE AUDITORÍA */}
            {activeTab === "audit" && (
              <div className="space-y-6">
                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                  
                  {/* Log 1: Creación */}
                  <div className="relative pl-9 space-y-1 text-xs">
                    <span className="absolute left-[11px] top-1.5 w-2 h-2 rounded-full bg-muted-foreground border border-card ring-4 ring-accent" />
                    <div className="flex justify-between items-center font-mono text-[11px]">
                      <span className="font-semibold text-foreground">Registro en Base de Datos</span>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {new Date(lead.created_at).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[10px]">Lead capturado vía Portal Web de VentiTech OS.</p>
                    <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-mono pt-0.5">
                      <span>Actor: SYSTEM (Wizard)</span>
                      <span>IP: 186.29.102.15</span>
                    </div>
                  </div>

                  {/* Log 2: Estado Actual */}
                  <div className="relative pl-9 space-y-1 text-xs">
                    <span className="absolute left-[11px] top-1.5 w-2 h-2 rounded-full bg-primary border border-card ring-4 ring-accent/60 animate-pulse" />
                    <div className="flex justify-between items-center font-mono text-[11px]">
                      <span className="font-semibold text-foreground">Estado Actual en Pipeline</span>
                      <span className="text-[9px] text-primary font-mono font-bold">// LIVE</span>
                    </div>
                    <p className="text-muted-foreground text-[10px]">Asignado al Ejecutivo de Ventas Comercial para calificación.</p>
                    <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-mono pt-0.5">
                      <span>Actor: {lead.assigned_user_id ? "Comercial Asignado" : "Pendiente"}</span>
                      <span>Estado: {lead.status}</span>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-border text-center flex items-center justify-center gap-2 text-[9px] text-muted-foreground font-mono tracking-wider">
                  <Database className="w-3.5 h-3.5 text-primary" /> Bitácora Conectada
                </div>
              </div>
            )}

          </div>

          {/* Footer Panel */}
          <div className="p-6 border-t border-border bg-accent/20 flex justify-end">
            <Button onClick={onClose} className="border-border hover:bg-accent text-xs cursor-pointer text-foreground bg-card">
              Cerrar Panel
            </Button>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
