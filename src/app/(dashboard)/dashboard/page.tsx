"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Briefcase, 
  Percent, 
  ShieldAlert, 
  AlertTriangle,
  ArrowRight,
  Database
} from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const [currency, setCurrency] = useState<"COP" | "USD">("COP");
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const [companyName, setCompanyName] = useState<string>("VentiTech OS");

  useEffect(() => {
    const loadCachedBranding = () => {
      const cacheKey = `tenant_config_${tenantParam || "default"}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const config = JSON.parse(cached);
          setCompanyName(config.nombre_comercial || (tenantParam === "apex" ? "Apex Logística" : "VentiTech"));
        } catch (e) {}
      } else {
        setCompanyName(tenantParam === "apex" ? "Apex Logística" : "VentiTech");
      }
    };
    loadCachedBranding();
  }, [tenantParam]);

  // Real-time Activity Logs (Auditoría Inmutable)
  const [activities] = useState([
    {
      id: "act-1",
      action: "Diagnóstico Registrado",
      resource: "Lead: Acerías del Caribe (AX-HV-150)",
      user: "Julio Gómez",
      ip: "186.29.102.15",
      time: "2m",
      type: "lead"
    },
    {
      id: "act-2",
      action: "Cotización Generada",
      resource: "Doc: COT-2026-004-V1",
      user: "Carlos Soto",
      ip: "190.142.66.22",
      time: "15m",
      type: "quote"
    },
    {
      id: "act-3",
      action: "Control de Calidad Aprobado",
      resource: "Job: OT-9942 (Balanceo Dinámico)",
      user: "Ing. Clara Restrepo",
      ip: "186.29.102.24",
      time: "45m",
      type: "job"
    },
    {
      id: "act-4",
      action: "Movimiento de Almacén",
      resource: "Salida: 4 Rodamientos SKF 6310-2RS",
      user: "Mario Pérez",
      ip: "190.142.66.45",
      time: "1h",
      type: "inventory"
    }
  ]);

  // Alertas de SLA sutiles
  const criticalSlas = [
    { id: "req-1", client: "Minera El Roble", timeRemaining: "5m", pct: 95 },
    { id: "req-2", client: "Data Center Level 3", timeRemaining: "42m", pct: 75 },
    { id: "req-3", client: "Plant Siderúrgica Gerdau", timeRemaining: "2.5h", pct: 40 }
  ];

  // Órdenes de Trabajo Críticas (Producción)
  const criticalJobs = [
    { id: "job-001", code: "OT-9942", desc: "Extractor Axial AX-HV-150-SS", stage: "Ensayos de Caudal", dateLimit: "Hoy 18:00", priority: "ALTA" },
    { id: "job-002", code: "OT-9945", desc: "Blower Centrífugo B-120", stage: "Corte y Soldadura", dateLimit: "2026-06-21", priority: "ALTA" },
    { id: "job-003", code: "OT-9948", desc: "Persiana de Gravedad PG-90", stage: "Montaje Mecánico", dateLimit: "2026-06-23", priority: "MEDIA" }
  ];

  // Stock Mínimo Crítico (Componentes)
  const lowStockItems = [
    { id: "inv-01", name: "Rodamiento de Rodillos SKF 22220", physical: 4, min: 20, unit: "und" },
    { id: "inv-02", name: "Motor IE4 Ultra-Eficiencia 15HP", physical: 1, min: 5, unit: "und" },
    { id: "inv-03", name: "Álabes de Acero Inoxidable AISI 316", physical: 12, min: 50, unit: "und" }
  ];

  // Formato Financiero Monoespaciado
  const formatValue = (copValue: number) => {
    if (currency === "USD") {
      const usd = copValue / 4000;
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(usd);
    }
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(copValue);
  };

  return (
    <div className="space-y-6">
      
      {/* SLA COMPACT ALERT BAR */}
      <div className="bg-card/60 backdrop-blur-md border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider">Alerta de Cumplimiento de SLA Técnico</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Existen requerimientos críticos que requieren revisión inmediata en el taller.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {criticalSlas.map((sla) => (
            <div key={sla.id} className="flex items-center gap-2 bg-accent/50 border border-border/80 px-3 py-1.5 rounded-md text-[10px] font-mono shadow-sm">
              <span className="font-medium text-foreground">{sla.client}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-destructive font-bold">{sla.timeRemaining}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HEADER DE CONTROL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground">
            {companyName}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            // Plataforma B2B para control de ingeniería, pipeline CRM y despacho industrial.
          </p>
        </div>

        {/* Selector de Moneda */}
        <div className="flex items-center bg-accent border border-border rounded-lg p-0.5">
          <button 
            onClick={() => setCurrency("COP")}
            className={`px-3 py-1 text-[9px] uppercase tracking-widest font-mono font-semibold rounded-md transition-colors cursor-pointer ${
              currency === "COP" ? "bg-card text-foreground border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            COP
          </button>
          <button 
            onClick={() => setCurrency("USD")}
            className={`px-3 py-1 text-[9px] uppercase tracking-widest font-mono font-semibold rounded-md transition-colors cursor-pointer ${
              currency === "USD" ? "bg-card text-foreground border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            USD
          </button>
        </div>
      </div>

      {/* Grid de KPIs de Precisión */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-lg border border-border bg-card shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-between hover:border-border/80 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Facturación Emitida</span>
            <FileText className="w-3.5 h-3.5 text-muted-foreground/80 stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-foreground font-mono mt-3 tracking-tight">{formatValue(498000000)}</div>
          <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-3 h-3 text-primary stroke-[2]" /> <span className="font-bold text-primary">+12.5%</span> VS ANTERIOR
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-lg border border-border bg-card shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-between hover:border-border/80 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Recaudo Cartera</span>
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground/80 stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-foreground font-mono mt-3 tracking-tight">{formatValue(392800000)}</div>
          <div className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-widest text-[9px]">
            TASA RECAUDO: <span className="font-bold text-foreground">78.8%</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-lg border border-border bg-card shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-between hover:border-border/80 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Capacidad Activa</span>
            <Briefcase className="w-3.5 h-3.5 text-muted-foreground/80 stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-foreground font-mono mt-3 tracking-tight">42 OTs</div>
          <div className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-widest text-[9px]">
            ENSAMBLE: <span className="font-bold text-foreground">3</span> PENDIENTES
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-lg border border-border bg-card shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-between hover:border-border/80 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Conversión Leads</span>
            <Percent className="w-3.5 h-3.5 text-muted-foreground/80 stroke-[1.5]" />
          </div>
          <div className="text-xl font-bold text-foreground font-mono mt-3 tracking-tight">94.4%</div>
          <div className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-widest text-[9px]">
            COTIZACIONES: <span className="font-bold text-foreground">18</span> APROBADAS
          </div>
        </div>
      </div>

      {/* DISEÑO ASIMÉTRICO 70/30 */}
      <div className="grid gap-6 lg:grid-cols-10">
        
        {/* Columna Izquierda: Workspace Técnico (70% - col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Órdenes de Trabajo Críticas (Taller) */}
          <div className="border border-border rounded-lg bg-card/40 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-accent/30">
              <div>
                <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Órdenes de Trabajo Críticas</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Estado de balanceo y pruebas de turbomaquinaria en planta.</p>
              </div>
              <Link href="/dashboard/jobs" className="text-[9px] font-mono uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                Ver Todo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent/40 text-[9px] uppercase font-mono tracking-widest text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3 font-medium">OT Código</th>
                    <th className="p-3 font-medium">Descripción del Equipo</th>
                    <th className="p-3 font-medium">Fase Actual</th>
                    <th className="p-3 font-medium">Fecha Entrega</th>
                    <th className="p-3 font-medium text-center">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {criticalJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-accent/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">
                        <span className="bg-accent border border-border/80 px-2 py-0.5 rounded text-[10px]">
                          {job.code}
                        </span>
                      </td>
                      <td className="p-3 text-foreground font-medium">{job.desc}</td>
                      <td className="p-3 text-foreground/80">
                        <span className="flex items-center gap-2 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> {job.stage}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-[11px]">{job.dateLimit}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono border ${
                          job.priority === "ALTA" 
                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                            : "bg-accent text-muted-foreground border-border"
                        }`}>
                          {job.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventario Mínimo y Existencias Críticas */}
          <div className="border border-border rounded-lg bg-card/40 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-accent/30">
              <div>
                <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Alertas de Stock de Insumos</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Componentes críticos por debajo del inventario de seguridad.</p>
              </div>
              <Link href="/dashboard/inventory" className="text-[9px] font-mono uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                Ver Inventario <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent/40 text-[9px] uppercase font-mono tracking-widest text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3 font-medium">Material / Insumo</th>
                    <th className="p-3 font-medium text-right">Existencia Física</th>
                    <th className="p-3 font-medium text-right">Mínimo Requerido</th>
                    <th className="p-3 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                      <td className="p-3 text-foreground font-medium">{item.name}</td>
                      <td className="p-3 text-right text-destructive font-mono font-semibold">{item.physical} {item.unit}</td>
                      <td className="p-3 text-right text-muted-foreground font-mono">{item.min} {item.unit}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono bg-destructive/10 text-destructive border border-destructive/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> Reordenar
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Feed Operacional (30% - col-span-3) */}
        <div className="lg:col-span-3">
          <div className="border border-border rounded-lg bg-card/65 backdrop-blur-md p-4 space-y-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
            <div>
              <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Historial de Auditoría</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Eventos inmutables registrados en el tenant.</p>
            </div>

            {/* Vertical Timeline formatted as custom system terminal logs */}
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="p-3 rounded-md bg-background/50 border border-border/80 font-mono text-[10px] space-y-1.5 flex flex-col hover:border-primary/40 transition-colors shadow-xs">
                  <div className="flex justify-between items-center border-b border-border/40 pb-1">
                    <span className="font-bold text-primary">// {act.action.toUpperCase()}</span>
                    <span className="text-muted-foreground text-[8px]">{act.time} AGO</span>
                  </div>
                  <p className="text-foreground/90 font-mono font-medium leading-relaxed">{act.resource}</p>
                  
                  <div className="flex items-center justify-between text-[8px] text-muted-foreground/80 pt-1 border-t border-border/30">
                    <span>OP: {act.user.toUpperCase()}</span>
                    <span>IP: {act.ip}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border/80 text-center flex items-center justify-center gap-2 text-[9px] text-muted-foreground font-mono tracking-wider">
              <Database className="w-3.5 h-3.5 text-primary" /> LOGS CONECTADOS
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
