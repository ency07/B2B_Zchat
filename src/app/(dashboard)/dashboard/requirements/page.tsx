"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sparkles,
  Search,
  Plus,
  Wind,
  Gauge,
  Thermometer,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  User,
  ClipboardList,
  Upload,
  ArrowRight,
  MapPin
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import { getClients } from "@/app/actions";
import { 
  getRequirements, 
  createRequirement, 
  updateRequirementStatus, 
  RequirementRow 
} from "@/app/actions/requirements";
import { generateEngineeringReport } from "@/utils/engineering";

const reqSchema = z.object({
  title: z.string().min(5, { message: "El título del requerimiento debe tener al menos 5 caracteres." }),
  clientId: z.string().min(1, { message: "Por favor, selecciona un cliente B2B." }),
  category: z.string().min(1, { message: "Por favor, selecciona una categoría." }),
  priority: z.string().min(1, { message: "Por favor, selecciona el nivel de prioridad." }),
});

type ReqFormValues = z.infer<typeof reqSchema>;

interface ClientOption {
  id: string;
  name: string;
}

export default function RequirementsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [requirements, setRequirements] = React.useState<RequirementRow[]>([]);
  const [clients, setClients] = React.useState<ClientOption[]>([]);
  const [selectedReq, setSelectedReq] = React.useState<RequirementRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // UI States
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Engineering Field Variables for live simulation
  const [altitude, setAltitude] = React.useState<number>(2600); // default Bogotá
  const [temperature, setTemperature] = React.useState<number>(30); // default 30°C
  const [hasDucts, setHasDucts] = React.useState<boolean>(false);
  const [environment, setEnvironment] = React.useState<string>("heavy_plant");
  
  // Dimensions state inherited/edited
  const [dimensions, setDimensions] = React.useState({ length: 40, width: 25, height: 8 });

  // Checklist for visiting engineer
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({
    base_level: false,
    electrical_phases: false,
    airflow_direction: false,
    vibration_dampers: false,
  });

  // Action status simulation
  const [assignedEngineer, setAssignedEngineer] = React.useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = React.useState<boolean>(false);

  const form = useForm<ReqFormValues>({
    resolver: zodResolver(reqSchema),
    defaultValues: {
      title: "",
      clientId: "",
      category: "VENTILACION",
      priority: "MEDIUM",
    },
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const reqs = await getRequirements(tenantParam);
      const clis = await getClients(tenantParam);
      setRequirements(reqs);
      setClients(clis.map(c => ({ id: c.id, name: c.name })));

      if (selectedReq) {
        const updated = reqs.find(r => r.id === selectedReq.id);
        if (updated) setSelectedReq(updated);
      }
    } catch (err) {
      console.error("Error loading requirements data:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam, selectedReq]);

  React.useEffect(() => {
    loadData();
  }, [tenantParam]);

  const onSubmit = async (values: ReqFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createRequirement(tenantParam, {
        title: values.title,
        clientId: values.clientId,
        category: values.category,
        priority: values.priority,
      });
      setIsSheetOpen(false);
      form.reset();
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al crear requerimiento técnico.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectReq = (req: RequirementRow) => {
    setSelectedReq(req);
    // Simulate loading details of the inherited diagnostic
    setEnvironment(req.category === "MANTENIMIENTO" ? "mecanico" : "heavy_plant");
    setAssignedEngineer(req.engineering_user_id ? "Ing. Carlos Mendoza" : null);
    setUploadedDoc(false);
    setChecklist({
      base_level: false,
      electrical_phases: false,
      airflow_direction: false,
      vibration_dampers: false,
    });
  };

  const handleAssignEngineer = async () => {
    if (!selectedReq) return;
    try {
      const mockEngId = tenantParam === "apex" ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";
      await updateRequirementStatus(selectedReq.id, "DIAGNOSTICO", { engineering_user_id: mockEngId });
      setAssignedEngineer("Ing. Carlos Mendoza");
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUploadReport = () => {
    setUploadedDoc(true);
    alert("Reporte Diagnóstico Técnico PDF cargado exitosamente. Flujo desbloqueado para Cotización.");
  };

  const handleAdvanceToQuote = async () => {
    if (!selectedReq) return;
    try {
      const mockSalesId = tenantParam === "apex" ? "b9000000-0000-0000-0000-000000000000" : "a9000000-0000-0000-0000-000000000000";
      await updateRequirementStatus(selectedReq.id, "COTIZACION", { sales_user_id: mockSalesId });
      await loadData();
      alert("Flujo avanzado con éxito. El requerimiento técnico se encuentra ahora en fase de COTIZACION.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Run thermodynamic report
  const report = generateEngineeringReport(
    dimensions,
    environment,
    altitude,
    temperature,
    hasDucts
  );

  const filteredRequirements = requirements.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.requirement_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.client?.legal_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Ingeniería
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Requerimientos Técnicos y Visitas
          </h1>
          <p className="text-xs text-muted-foreground">
            Levantamiento de campo, simulación termodinámica y validación de ducterías en tiempo de ejecución.
          </p>
        </div>

        {/* Sheet for new technical requirements */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Nuevo Requerimiento
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md backdrop-blur-md">
            <div className="p-8 space-y-6 bg-card">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Levantamiento / Comercial</span>
                <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Crear Requerimiento</h3>
                <p className="text-xs text-muted-foreground">Inicia la ficha técnica a partir del contacto comercial B2B.</p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Título del Requerimiento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Ventilación Planta de Inyección 2" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Cliente Asociado (Cuenta B2B)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Seleccione el cliente B2B" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {clients.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Categoría Operativa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Seleccione la categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="VENTILACION">Ventilación General</SelectItem>
                            <SelectItem value="MANTENIMIENTO">Mantenimiento y Balanceo</SelectItem>
                            <SelectItem value="PROYECTO_ESPECIAL">Proyecto Especial / Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Prioridad Comercial</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Defina la prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="LOW">Baja (Sin urgencia)</SelectItem>
                            <SelectItem value="MEDIUM">Media (Programada)</SelectItem>
                            <SelectItem value="HIGH">Alta (SLA / Cierre inmediato)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-2">
                    <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                      {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                      Registrar Requerimiento
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main split grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Requirements list (40% - 4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar requerimiento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
              <Spinner size="lg" className="text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando requerimientos...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredRequirements.map(req => {
                const isSelected = selectedReq?.id === req.id;
                let priorityVariant: "secondary" | "warning" | "destructive" = "secondary";
                if (req.priority === "HIGH") priorityVariant = "destructive";
                if (req.priority === "MEDIUM") priorityVariant = "warning";

                return (
                  <div
                    key={req.id}
                    onClick={() => handleSelectReq(req)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2.5 ${
                      isSelected 
                        ? "bg-accent border-primary/50 shadow-md" 
                        : "bg-card/50 border-border hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded shadow-sm">
                        {req.requirement_code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={priorityVariant} className="text-[8px] font-mono tracking-wider py-0 px-1 uppercase">
                          {req.priority}
                        </Badge>
                        <Badge variant={req.status === "COTIZACION" || req.status === "COMPLETADO" ? "success" : req.status === "DIAGNOSTICO" ? "info" : "warning"} className="text-[8px] py-0 px-1 font-semibold font-mono uppercase">
                          {req.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">{req.title}</h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <User className="w-3 h-3 text-primary" /> {req.client?.legal_name || "Cliente General"}
                      </p>
                    </div>
                  </div>
                );
              })}

              {filteredRequirements.length === 0 && (
                <div className="border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  // No se encontraron requerimientos registrados.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Engineering Workspace (60% - 8 cols) */}
        <div className="xl:col-span-8 border border-border bg-card/45 rounded-xl backdrop-blur-md overflow-hidden flex flex-col min-h-[640px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
          {selectedReq ? (
            <div className="flex-1 flex flex-col">
              
              {/* Workspace Header */}
              <div className="p-6 border-b border-border bg-accent/25 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{selectedReq.requirement_code}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">• {selectedReq.category}</span>
                  </div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-foreground mt-0.5">
                    {selectedReq.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    Levantamiento técnico para: <span className="font-semibold text-foreground">{selectedReq.client?.legal_name}</span>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">// Flujo Técnico</div>
                  <Badge variant={selectedReq.status === "COTIZACION" || selectedReq.status === "COMPLETADO" ? "success" : "warning"} className="text-[9px] font-mono uppercase py-0.5 px-2">
                    ETAPA: {selectedReq.status}
                  </Badge>
                </div>
              </div>

              {/* Workspace Panels */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[580px]">
                
                {/* 1. Dimensiones y Parámetros Termodinámicos */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> // Parámetros del Entorno Real
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Altitud */}
                    <div className="space-y-1.5 bg-background border border-border p-3 rounded-lg shadow-inner">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-primary" /> Altitud de Planta
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={altitude}
                          onChange={(e) => setAltitude(Number(e.target.value))}
                          className="bg-transparent border-0 p-0 text-foreground text-sm font-mono font-bold w-20 focus:ring-0 focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">msnm</span>
                      </div>
                    </div>

                    {/* Temperatura */}
                    <div className="space-y-1.5 bg-background border border-border p-3 rounded-lg shadow-inner">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-primary" /> Temp. Operación
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={temperature}
                          onChange={(e) => setTemperature(Number(e.target.value))}
                          className="bg-transparent border-0 p-0 text-foreground text-sm font-mono font-bold w-20 focus:ring-0 focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">°C</span>
                      </div>
                    </div>

                    {/* Ductería */}
                    <button 
                      onClick={() => setHasDucts(!hasDucts)}
                      className={`p-3 rounded-lg border transition-all text-left space-y-1 cursor-pointer select-none shadow-sm ${
                        hasDucts 
                          ? "bg-primary/10 border-primary/20" 
                          : "bg-background border-border hover:bg-accent"
                      }`}
                    >
                      <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-between">
                        <span>Pérdida por Ductería</span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          hasDucts ? "border-primary bg-primary/10" : "border-border"
                        }`}>
                          {hasDucts && <span className="w-1.5 h-1.5 bg-primary/80 rounded-full" />}
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-foreground">
                        {hasDucts ? "Red de Ductos Activa (+1.5 inWG)" : "Salida Libre (+0.5 inWG)"}
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Dimensión de Nave (Editable) */}
                <div className="space-y-3 bg-accent/25 border border-border/80 p-4 rounded-xl shadow-xs">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">// Dimensiones Físicas del Recinto</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-mono">Largo (m)</label>
                      <input 
                        type="number"
                        value={dimensions.length}
                        onChange={(e) => setDimensions({ ...dimensions, length: Number(e.target.value) })}
                        className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs font-mono text-foreground focus:ring-primary focus:outline-none shadow-inner"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-mono">Ancho (m)</label>
                      <input 
                        type="number"
                        value={dimensions.width}
                        onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                        className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs font-mono text-foreground focus:ring-primary focus:outline-none shadow-inner"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-mono">Alto (m)</label>
                      <input 
                        type="number"
                        value={dimensions.height}
                        onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                        className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs font-mono text-foreground focus:ring-primary focus:outline-none shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Resultados de Simulación Termodinámica en Vivo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Wind className="w-3.5 h-3.5 text-primary" /> // Resultados del Recálculo
                    </h4>
                    <Badge variant={report.criticality === "ALTA" ? "destructive" : report.criticality === "MEDIA" ? "warning" : "secondary"} className="text-[9px] font-mono uppercase">
                      Carga Térmica: {report.criticality}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Air Density & Velocity */}
                    <div className="space-y-3 bg-accent/20 border border-border rounded-xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                        <span className="text-muted-foreground font-mono">Densidad Aire:</span>
                        <span className={`font-mono font-bold ${report.airDensity < 1.0 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-450"}`}>
                          {report.airDensity} kg/m³
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                        <span className="text-muted-foreground font-mono">Caudal Aerodinámico:</span>
                        <span className="font-mono font-bold text-foreground">{report.cfm.toLocaleString()} CFM</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="text-muted-foreground font-mono">Velocidad Salida:</span>
                        <span className="font-mono font-bold text-foreground">{report.airVelocityFpm} FPM</span>
                      </div>

                      {report.airDensity < 1.0 && (
                        <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] leading-relaxed font-mono">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          // Densidad baja por calor/altitud. Corregir motor para prevenir sobrecalentamiento.
                        </div>
                      )}
                    </div>

                    {/* Potencia & Distribución */}
                    <div className="space-y-3 bg-accent/20 border border-border rounded-xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                        <span className="text-muted-foreground font-mono">Equipos Sugeridos (7.5K CFM):</span>
                        <span className="font-mono font-bold text-foreground">{report.eqCount} u.</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
                        <span className="text-muted-foreground font-mono">Distribución:</span>
                        <span className="font-semibold text-primary text-right text-[11px] leading-tight max-w-[150px] font-mono">{report.distribution}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="text-muted-foreground font-mono">Potencia Total:</span>
                        <span className="font-mono font-bold text-foreground">{report.powerHp} HP / {report.powerKw} kW</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Checklist Técnico de Inspección en Sitio */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <ClipboardList className="w-3.5 h-3.5 text-primary" /> // Verificación del Ingeniero de Campo
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { id: "base_level", label: "Inspección de anclajes físicos y nivelación" },
                      { id: "electrical_phases", label: "Medición de fases de alimentación eléctrica" },
                      { id: "airflow_direction", label: "Verificación de dirección de tiro del aire" },
                      { id: "vibration_dampers", label: "Instalación de juntas y soportes antivibración" }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setChecklist({ ...checklist, [item.id]: !checklist[item.id] })}
                        className={`flex items-center gap-2.5 p-2.5 rounded border transition-all text-xs text-left cursor-pointer ${
                          checklist[item.id] 
                            ? "bg-accent border-primary/20 text-foreground" 
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          checklist[item.id] ? "border-primary bg-primary/10" : "border-border"
                        }`}>
                          {checklist[item.id] && <span className="w-1.5 h-1.5 bg-primary/80 rounded-full" />}
                        </div>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Business rules progression */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <FileCheck2 className="w-3.5 h-3.5 text-primary" /> // Control del Proceso Técnico
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Step 1: Technical Assignee */}
                    <div className="border border-border bg-accent/20 p-3.5 rounded-xl flex flex-col justify-between space-y-3.5 shadow-xs">
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-muted-foreground uppercase font-bold">// Paso 1: Asignar Técnico</div>
                        <p className="text-[11px] text-muted-foreground leading-tight">Es obligatorio asignar un responsable para iniciar el Diagnóstico.</p>
                      </div>
                      
                      {assignedEngineer ? (
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 font-mono bg-emerald-500/10 border border-emerald-500/25 p-1.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Asignado: Ing. Carlos
                        </div>
                      ) : (
                        <Button 
                          onClick={handleAssignEngineer}
                          className="w-full bg-card border border-border text-foreground hover:bg-accent text-[11px] h-8 cursor-pointer shadow-sm"
                        >
                          Asignar Responsable
                        </Button>
                      )}
                    </div>

                    {/* Step 2: Upload Diagnostic PDF */}
                    <div className="border border-border bg-accent/20 p-3.5 rounded-xl flex flex-col justify-between space-y-3.5 shadow-xs">
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-muted-foreground uppercase font-bold">// Paso 2: Cargar Informe</div>
                        <p className="text-[11px] text-muted-foreground leading-tight">Requiere subir reporte en formato PDF para habilitar cotización.</p>
                      </div>

                      {uploadedDoc ? (
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 font-mono bg-emerald-500/10 border border-emerald-500/25 p-1.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Diagnóstico PDF OK
                        </div>
                      ) : (
                        <Button 
                          onClick={handleUploadReport}
                          disabled={!assignedEngineer}
                          className="w-full bg-card border border-border text-foreground hover:bg-accent text-[11px] h-8 disabled:opacity-30 cursor-pointer shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" /> Cargar Reporte
                        </Button>
                      )}
                    </div>

                    {/* Step 3: Advance to Quotation */}
                    <div className="border border-border bg-accent/20 p-3.5 rounded-xl flex flex-col justify-between space-y-3.5 shadow-xs">
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-muted-foreground uppercase font-bold">// Paso 3: Avanzar Flujo</div>
                        <p className="text-[11px] text-muted-foreground leading-tight">Mueve el estado a COTIZACION para habilitar tabla de SKUs.</p>
                      </div>

                      <Button 
                        onClick={handleAdvanceToQuote}
                        disabled={!uploadedDoc || selectedReq.status === "COTIZACION"}
                        className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] h-8 disabled:opacity-30 flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        Avanzar <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl border border-border bg-accent flex items-center justify-center text-muted-foreground">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-widest">// Workspace Técnico</h4>
                <p className="text-[11px] text-muted-foreground max-w-[280px]">
                  Seleccione un requerimiento técnico del listado de la izquierda para ingresar al editor de campo y simulador aerodinámico.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
