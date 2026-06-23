"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  PenTool,
  Clock,
  CheckSquare,
  Wrench,
  ShieldCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { getJobs, createJob } from "@/app/actions";

// Zod schema for job creation with date validations
const jobSchema = z.object({
  description: z.string().min(5, { message: "La descripción debe tener al menos 5 caracteres." }),
  assignedTech: z.string().min(1, { message: "Por favor, selecciona un técnico responsable." }),
  priority: z.string().min(1, { message: "Por favor, selecciona la prioridad del trabajo." }),
  startDate: z.string().min(1, { message: "Por favor, selecciona la fecha de inicio." }),
  endDate: z.string().min(1, { message: "Por favor, selecciona la fecha de finalización." }),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "La fecha de finalización debe ser igual o posterior a la fecha de inicio.",
  path: ["endDate"],
});

type JobFormValues = z.infer<typeof jobSchema>;

interface Job {
  id: string;
  code: string;
  description: string;
  assignedTech: string;
  priority: "BAJA" | "MEDIA" | "ALTA";
  startDate: string;
  endDate: string;
  status: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA";
}

// Checklist structure per job
interface ChecklistPhase {
  name: string;
  items: { id: string; label: string; checked: boolean }[];
}

export default function JobsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // States
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Local interactive state for job checklist
  const [jobChecklists, setJobChecklists] = React.useState<Record<string, ChecklistPhase[]>>({});
  // Local interactive state for signatures
  const [signatures, setSignatures] = React.useState<Record<string, { signed: boolean; name: string; date: string }>>({});
  // Local interactive state for test measurements
  const [measurements, setMeasurements] = React.useState<Record<string, { targetCfm: string; measuredCfm: string; vibration: string; current: string }>>({});

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      description: "",
      assignedTech: "",
      priority: "",
      startDate: "",
      endDate: "",
    },
  });

  const loadJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJobs(tenantParam);
      setJobs(data);
      // If we already have a selected job, refresh its reference from new data
      if (selectedJob) {
        const updated = data.find((j) => j.id === selectedJob.id);
        if (updated) setSelectedJob(updated);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam, selectedJob]);

  React.useEffect(() => {
    loadJobs();
  }, [tenantParam]);

  const onSubmit = async (values: JobFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createJob(tenantParam, values);
      setIsSheetOpen(false);
      form.reset();
      await loadJobs();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al registrar el trabajo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to initialize checklist for a job if not exists
  const getJobChecklist = (jobId: string): ChecklistPhase[] => {
    if (jobChecklists[jobId]) return jobChecklists[jobId];
    return [
      {
        name: "1. Diseño e Ingeniería",
        items: [
          { id: "cad", label: "Planos CAD estructurales aprobados", checked: false },
          { id: "bom", label: "Lista de materiales (BOM) asignada", checked: false },
          { id: "dim", label: "Verificación de dimensiones teóricas", checked: false },
        ]
      },
      {
        name: "2. Corte y Chasis",
        items: [
          { id: "laser", label: "Corte láser de láminas de acero", checked: false },
          { id: "bend", label: "Rolado y conformado de caracol", checked: false },
          { id: "weld", label: "Soldadura estructural de soportes", checked: false },
        ]
      },
      {
        name: "3. Rotación y Balanceo",
        items: [
          { id: "align", label: "Alineación de eje y poleas", checked: false },
          { id: "stat", label: "Balanceo estático del impulsor", checked: false },
          { id: "dyn", label: "Balanceo dinámico grado G2.5 (ISO 1940)", checked: false },
        ]
      },
      {
        name: "4. Pruebas Funcionales",
        items: [
          { id: "vib", label: "Ensayo vibracional en banco de pruebas", checked: false },
          { id: "cfm", label: "Medición aerodinámica de caudal", checked: false },
          { id: "elec", label: "Consumo de corriente del motor (Amperaje)", checked: false },
        ]
      },
      {
        name: "5. Embalaje y Certificación",
        items: [
          { id: "paint", label: "Pintura y acabado anticorrosivo", checked: false },
          { id: "qa_check", label: "Checklist final de control de calidad", checked: false },
          { id: "package", label: "Embalaje industrial y guía de despacho", checked: false },
        ]
      }
    ];
  };

  const handleToggleItem = (jobId: string, phaseIndex: number, itemId: string) => {
    const current = [...getJobChecklist(jobId)];
    const phase = current[phaseIndex];
    phase.items = phase.items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setJobChecklists({
      ...jobChecklists,
      [jobId]: current
    });
  };

  // Helper to compute overall progress of checklist
  const getJobProgress = (jobId: string): number => {
    const list = getJobChecklist(jobId);
    let total = 0;
    let checked = 0;
    list.forEach(p => {
      p.items.forEach(item => {
        total++;
        if (item.checked) checked++;
      });
    });
    return total === 0 ? 0 : Math.round((checked / total) * 100);
  };

  const handleSign = (jobId: string, name: string) => {
    if (!name.trim()) return;
    setSignatures({
      ...signatures,
      [jobId]: {
        signed: true,
        name: name,
        date: new Date().toLocaleDateString("es-CO", { hour: "2-digit", minute: "2-digit" })
      }
    });
  };

  const handleUpdateMeasurements = (jobId: string, field: string, value: string) => {
    const curr = measurements[jobId] || { targetCfm: "7500", measuredCfm: "", vibration: "", current: "" };
    setMeasurements({
      ...measurements,
      [jobId]: {
        ...curr,
        [field]: value
      }
    });
  };

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "code",
      header: "Código OT",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedJob(row.original)}
          className="text-left font-mono font-semibold text-xs text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
        >
          {row.getValue("code")}
        </button>
      ),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-xs font-semibold text-foreground">
          {row.getValue("description")}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        let variant: "success" | "warning" | "destructive" | "secondary" = "secondary";
        if (priority === "MEDIA") variant = "warning";
        if (priority === "ALTA") variant = "destructive";
        return <Badge variant={variant} className="text-[9px] font-mono font-bold tracking-wider py-0 px-1.5 uppercase">{priority}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "success" | "warning" | "destructive" | "secondary" | "info" = "secondary";
        if (status === "COMPLETADA") variant = "success";
        if (status === "EN_PROGRESO") variant = "info";
        if (status === "PENDIENTE") variant = "warning";
        if (status === "CANCELADA") variant = "destructive";
        return <Badge variant={variant} className="text-[9px] font-semibold py-0 px-1 font-mono uppercase">{status}</Badge>;
      },
    },
  ];

  const table = useReactTable({
    data: jobs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  });

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Centro de Control de Producción
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Órdenes de Trabajo e Ingeniería (OT)
          </h1>
          <p className="text-xs text-muted-foreground">
            Seguimiento de fases de fabricación, balanceo estator-rotor y calibración aerodinámica de ventiladores.
          </p>
        </div>

        {/* Sheet Slide-out to Create OT */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Nueva Orden de Trabajo
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md backdrop-blur-md">
            <div className="p-8 space-y-6 bg-card">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Producción / Taller</span>
                <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Abrir Orden de Trabajo</h3>
                <p className="text-xs text-muted-foreground">Ingresa los parámetros iniciales de ingeniería y programación de la obra.</p>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Descripción del Trabajo / Equipo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Extractor Ax-7500 CFM Chasis Reforzado" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTech"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Técnico Principal Responsable</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Selecciona el técnico principal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="Ing. Carlos Mendoza">Ing. Carlos Mendoza (Calidad)</SelectItem>
                            <SelectItem value="Téc. Andrés Silva">Téc. Andrés Silva (Estructura)</SelectItem>
                            <SelectItem value="Téc. Sofía Ramos">Téc. Sofía Ramos (Balanceo)</SelectItem>
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
                        <FormLabel className="text-xs font-semibold text-foreground">Nivel de Prioridad Operativa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Establecer prioridad de entrega" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="BAJA">Baja (Mantenimientos rutinarios)</SelectItem>
                            <SelectItem value="MEDIA">Media (Órdenes programadas)</SelectItem>
                            <SelectItem value="ALTA">Alta (SLA crítico / Emergencia)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-foreground">Inicio de Obra</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-background border-border text-foreground text-xs font-mono shadow-inner focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-foreground">Fin / Entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-background border-border text-foreground text-xs font-mono shadow-inner focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-2">
                    <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                      {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                      Programar Orden
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Grid 50/50 Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Panel: Table of OTs */}
        <div className="xl:col-span-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción..."
                value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)}
                className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
              <Spinner size="lg" className="text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando órdenes...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card/45 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
                <Table>
                  <TableHeader className="bg-accent/40 border-b border-border">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="text-muted-foreground font-mono text-[9px] uppercase tracking-widest py-3">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow 
                          key={row.id}
                          onClick={() => setSelectedJob(row.original)}
                          className={`cursor-pointer transition-colors border-b border-border/40 hover:bg-accent/30 ${
                            selectedJob?.id === row.original.id ? "bg-accent/35" : ""
                          }`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-2 px-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest py-8">
                          // No se encontraron órdenes de trabajo registradas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <div>
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
                </div>
                <div className="flex items-center space-x-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Job Control Center */}
        <div className="xl:col-span-6 border border-border bg-card/45 rounded-xl backdrop-blur-md overflow-hidden flex flex-col min-h-[640px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
          {selectedJob ? (
            <div className="flex-grow flex flex-col">
              {/* Control Header */}
              <div className="p-6 border-b border-border bg-accent/25 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground bg-accent border border-border/80 px-2 py-0.5 rounded shadow-sm">
                      {selectedJob.code}
                    </span>
                    <Badge variant={selectedJob.status === "COMPLETADA" ? "success" : selectedJob.status === "EN_PROGRESO" ? "info" : "warning"} className="text-[9px] font-semibold py-0 px-1.5 font-mono uppercase">
                      {selectedJob.status}
                    </Badge>
                  </div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-foreground mt-0.5">
                    {selectedJob.description}
                  </h3>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-primary" /> Programado: {selectedJob.startDate} al {selectedJob.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest font-bold">// Avance</div>
                  <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-450 tracking-tight mt-0.5">
                    {getJobProgress(selectedJob.id)}%
                  </div>
                </div>
              </div>

              {/* Detail Tabs/Sections */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[580px]">
                
                {/* 1. Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-background border border-border h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${getJobProgress(selectedJob.id)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Interactive Phase Checklists */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" /> // Bitácora de Procesos y QA
                  </div>
                  
                  <div className="space-y-3.5">
                    {getJobChecklist(selectedJob.id).map((phase, pIdx) => {
                      const phaseCheckedCount = phase.items.filter(i => i.checked).length;
                      const phaseTotalCount = phase.items.length;
                      const isPhaseDone = phaseCheckedCount === phaseTotalCount;

                      return (
                        <div key={pIdx} className="rounded-lg border border-border bg-accent/20 p-3.5 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold transition-colors font-mono uppercase tracking-wider ${isPhaseDone ? "text-emerald-600 dark:text-emerald-450" : "text-foreground"}`}>
                              {phase.name}
                            </h4>
                            <span className="text-[10px] font-mono text-muted-foreground font-bold bg-card border border-border px-1.5 py-0.5 rounded shadow-sm">
                              {phaseCheckedCount}/{phaseTotalCount} OK
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {phase.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleToggleItem(selectedJob.id, pIdx, item.id)}
                                className={`flex items-start text-left gap-2.5 p-2 rounded border transition-all text-xs cursor-pointer ${
                                  item.checked 
                                    ? "bg-accent border-emerald-500/20 text-muted-foreground" 
                                    : "bg-background border-border text-foreground hover:bg-accent/40"
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                  item.checked ? "border-emerald-500 bg-emerald-500/10" : "border-border"
                                }`}>
                                  {item.checked && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                </div>
                                <span className={item.checked ? "line-through opacity-60" : ""}>
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Engineering Parameter Tests (Banco de Ensayos) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <Wrench className="w-3.5 h-3.5 text-primary" /> // Banco de Pruebas y Tolerancia ISO
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-accent/20 border border-border rounded-xl p-4 shadow-xs">
                    {/* Design Specs (Static read-only) */}
                    <div className="space-y-2 border-r border-border/80 pr-2">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">// Parámetros Diseño</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Caudal:</span>
                          <span className="text-foreground font-semibold">7,500 CFM</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Presión Estática:</span>
                          <span className="text-foreground font-semibold">1.2 inWG</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Corriente Nominal:</span>
                          <span className="text-foreground font-semibold">14.5 A</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Vibración Máx:</span>
                          <span className="text-foreground font-semibold">1.8 mm/s</span>
                        </div>
                      </div>
                    </div>

                    {/* Measured Specs (Interactive) */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">// Medición Real</div>
                      <div className="space-y-2">
                        {/* Flow */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-mono text-muted-foreground shrink-0">Caudal Medido:</label>
                          <div className="flex items-center bg-background border border-border rounded px-1.5 py-0.5 max-w-[100px] shadow-inner">
                            <input 
                              type="number" 
                              placeholder="0"
                              value={measurements[selectedJob.id]?.measuredCfm || ""}
                              onChange={(e) => handleUpdateMeasurements(selectedJob.id, "measuredCfm", e.target.value)}
                              className="w-full bg-transparent border-0 p-0 text-right text-xs font-mono text-emerald-600 dark:text-emerald-450 font-bold focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[9px] font-mono text-muted-foreground ml-1">CFM</span>
                          </div>
                        </div>

                        {/* Vibration */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-mono text-muted-foreground shrink-0">Vibración:</label>
                          <div className="flex items-center bg-background border border-border rounded px-1.5 py-0.5 max-w-[100px] shadow-inner">
                            <input 
                              type="text" 
                              placeholder="0.0"
                              value={measurements[selectedJob.id]?.vibration || ""}
                              onChange={(e) => handleUpdateMeasurements(selectedJob.id, "vibration", e.target.value)}
                              className="w-full bg-transparent border-0 p-0 text-right text-xs font-mono text-emerald-600 dark:text-emerald-450 font-bold focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[9px] font-mono text-muted-foreground ml-1">mm/s</span>
                          </div>
                        </div>

                        {/* Amperage */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-mono text-muted-foreground shrink-0">Amperaje:</label>
                          <div className="flex items-center bg-background border border-border rounded px-1.5 py-0.5 max-w-[100px] shadow-inner">
                            <input 
                              type="text" 
                              placeholder="0.0"
                              value={measurements[selectedJob.id]?.current || ""}
                              onChange={(e) => handleUpdateMeasurements(selectedJob.id, "current", e.target.value)}
                              className="w-full bg-transparent border-0 p-0 text-right text-xs font-mono text-emerald-600 dark:text-emerald-450 font-bold focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[9px] font-mono text-muted-foreground ml-1">A</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Quality Approval Signature */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> // Firma y Liberación de Calidad
                  </div>

                  {signatures[selectedJob.id]?.signed ? (
                    <div className="border border-emerald-500/20 bg-emerald-500/10 rounded-xl p-4 flex items-center justify-between shadow-sm font-mono text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-450">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> // EQUIPO LIBERADO
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Inspector certificado: <span className="text-foreground font-bold">{signatures[selectedJob.id].name}</span>
                        </p>
                      </div>
                      <div className="text-right text-[9px] text-muted-foreground">
                        {signatures[selectedJob.id].date}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border bg-accent/20 rounded-xl p-4 space-y-3 shadow-xs">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        El equipo no ha sido liberado para el despacho comercial. Ingrese su nombre de inspector certificado para sellar la orden.
                      </p>
                      <div className="flex items-center gap-2.5">
                        <Input 
                          id="sig_name"
                          placeholder="Firma del Inspector de Calidad" 
                          className="bg-background border-border text-xs h-9 font-mono text-foreground placeholder-muted-foreground/60 flex-1 focus:ring-primary shadow-inner"
                        />
                        <Button 
                          onClick={() => {
                            const input = document.getElementById("sig_name") as HTMLInputElement;
                            if (input) {
                              handleSign(selectedJob.id, input.value);
                              input.value = "";
                            }
                          }}
                          className="bg-card border border-border text-foreground text-xs h-9 hover:bg-accent px-3 flex items-center gap-1 shrink-0 font-medium cursor-pointer shadow-sm"
                        >
                          <PenTool className="w-3.5 h-3.5" /> Firmar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom status helper */}
              <div className="p-4 border-t border-border bg-accent/25 text-[10px] font-mono text-muted-foreground text-center flex items-center justify-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-primary" /> Operario Responsable: {selectedJob.assignedTech}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl border border-border bg-accent flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-widest">// Consola de Control Mecánico</h4>
                <p className="text-[11px] text-muted-foreground max-w-[280px]">
                  Selecciona una orden de trabajo (OT) del listado de la izquierda para abrir la bitácora de control y banco de ensayos.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
