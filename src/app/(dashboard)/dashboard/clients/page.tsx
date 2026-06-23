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
  ArrowUpDown, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  Sparkles,
  Phone,
  Mail,
  FileCheck2,
  ClipboardList,
  Briefcase
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
import { getClients, createClient } from "@/app/actions";

// Zod schema for client registration (flexible B2B Tax ID NIT/Cédula)
const clientSchema = z.object({
  taxId: z
    .string()
    .min(8, { message: "El ID Fiscal/NIT debe tener al menos 8 caracteres." })
    .max(15, { message: "El ID Fiscal/NIT no puede superar los 15 caracteres." })
    .regex(/^[A-Z0-9-]{8,15}$/, {
      message: "Identificación fiscal inválida. Use letras, números y guiones.",
    }),
  name: z.string().min(5, { message: "La razón social debe tener al menos 5 caracteres." }),
  segment: z.string().min(1, { message: "Por favor, selecciona el segmento del cliente." }),
  email: z.string().email({ message: "Por favor, ingresa un correo electrónico válido." }),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  taxId: string;
  name: string;
  segment: string;
  totalInvoiced: number;
  status: "ACTIVO" | "SUSPENDIDO" | "PENDIENTE";
}

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sheet States
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<"create" | "detail">("create");
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [activeTab, setActiveTab] = React.useState<"info" | "contacts" | "history">("info");

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      taxId: "",
      name: "",
      segment: "",
      email: "",
    },
  });

  const loadClients = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClients(tenantParam);
      setClients(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    loadClients();
  }, [loadClients]);

  const onSubmit = async (values: ClientFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createClient(tenantParam, values);
      setIsSheetOpen(false);
      form.reset();
      await loadClients();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al registrar el cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setSheetMode("create");
    setSelectedClient(null);
    form.reset();
    setErrorMsg(null);
    setIsSheetOpen(true);
  };

  const handleOpenDetail = (client: Client) => {
    setSheetMode("detail");
    setSelectedClient(client);
    setActiveTab("info");
    setIsSheetOpen(true);
  };

  const formatCop = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(val);
  };

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "taxId",
      header: "ID Fiscal / NIT",
      cell: ({ row }) => <code className="text-[11px] font-mono text-foreground/80">{row.getValue("taxId")}</code>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground cursor-pointer font-semibold transition-colors border-none bg-transparent p-0 outline-hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          Razón Social
          <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => <div className="font-semibold text-foreground">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "segment",
      header: "Segmento",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue("segment")}</span>,
    },
    {
      accessorKey: "totalInvoiced",
      header: () => <div className="text-right font-semibold">Facturado Acum.</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalInvoiced"));
        return <div className="text-right font-mono font-bold text-foreground">{formatCop(amount)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variantStyle = "border-border bg-accent text-muted-foreground";
        if (status === "ACTIVO") {
          variantStyle = "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450";
        } else if (status === "PENDIENTE") {
          variantStyle = "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-450";
        } else if (status === "SUSPENDIDO") {
          variantStyle = "border-destructive/20 bg-destructive/10 text-destructive";
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono border ${variantStyle}`}>
            {status}
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data: clients,
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
        pageSize: 12,
      },
    },
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-1 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Clientes B2B
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Cuentas Industriales
          </h1>
          <p className="text-xs text-muted-foreground">
            Catálogo unificado de clientes B2B, contactos técnicos y facturación consolidada.
          </p>
        </div>

        {/* Sheet Trigger for registering new clients */}
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
          <UserPlus className="w-4 h-4" /> Registrar Cliente
        </Button>
      </div>

      {/* Filter and table */}
      <div className="space-y-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="pl-9 h-9 text-xs bg-card border-border text-foreground rounded-md shadow-inner"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 border border-border rounded-lg bg-card/30">
            <Spinner className="text-muted-foreground mb-2 w-6 h-6" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground font-bold">Cargando cuentas...</span>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card/45 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b border-border bg-accent/40 hover:bg-accent/40">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground py-3">
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
                        onClick={() => handleOpenDetail(row.original)}
                        className="hover:bg-accent/30 cursor-pointer border-b border-border/40 transition-colors"
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
                      <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                        // No se encontraron cuentas registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
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
                  className="h-8 px-3 border-border bg-card hover:bg-accent cursor-pointer text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-3 border-border bg-card hover:bg-accent cursor-pointer text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Slide-out Sheet Panel for Creation / Detailed Drill-down */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-xl backdrop-blur-md">
          
          {/* MODO CREACIÓN */}
          {sheetMode === "create" && (
            <div className="p-8 space-y-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Nueva Cuenta</span>
                <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Registrar Cliente B2B</h3>
                <p className="text-xs text-muted-foreground">Ingrese la identificación tributaria y la razón social legal de la planta.</p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Tax ID */}
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">NIT / Cédula / ID Fiscal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. 901201567-8" {...field} className="bg-background border-border text-foreground shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Business Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Razón Social</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Minera El Roble S.A." {...field} className="bg-background border-border text-foreground shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Segment */}
                  <FormField
                    control={form.control}
                    name="segment"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Segmento Industrial</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground shadow-inner focus:ring-primary">
                              <SelectValue placeholder="Selecciona el segmento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="Minería">Minería / Siderurgia</SelectItem>
                            <SelectItem value="Alimentos">Alimentos / Farmacéutica</SelectItem>
                            <SelectItem value="Data Center">Data Center / Servidores</SelectItem>
                            <SelectItem value="HVAC Comercial">HVAC Comercial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Contact Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Correo Electrónico Corporativo</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="compras@mineradelroble.co" {...field} className="bg-background border-border text-foreground shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6 border-t border-border flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border hover:bg-accent text-xs cursor-pointer text-foreground">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold px-4 cursor-pointer">
                      {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                      Guardar Cliente
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* MODO DETALLE (DRILL-DOWN) */}
          {sheetMode === "detail" && selectedClient && (
            <div className="flex flex-col h-full bg-card">
              
              {/* Header de Ficha */}
              <div className="p-8 border-b border-border space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Ficha de Cliente B2B</span>
                    <h3 className="text-base font-semibold text-foreground tracking-tight leading-tight">{selectedClient.name}</h3>
                    <code className="text-[9px] font-mono text-muted-foreground block">ID: {selectedClient.id}</code>
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono border ${
                    selectedClient.status === "ACTIVO" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450" :
                    selectedClient.status === "PENDIENTE" ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-450" :
                    "border-destructive/20 bg-destructive/10 text-destructive"
                  }`}>
                    {selectedClient.status}
                  </span>
                </div>

                {/* Tabs navigation */}
                <div className="flex border-b border-border text-xs pt-2 font-mono uppercase tracking-wider text-[10px]">
                  {[
                    { id: "info", label: "Especificación" },
                    { id: "contacts", label: "Contactos (3)" },
                    { id: "history", label: "Historial Comercial" }
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

              {/* Contenido de Ficha */}
              <div className="p-8 flex-1 space-y-6">
                
                {/* TAB 1: INFO GENERAL */}
                {activeTab === "info" && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg border border-border bg-accent/25 space-y-4 shadow-xs">
                      <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Datos de Registro</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Identificación Fiscal (NIT)</span>
                          <span className="font-mono font-bold text-foreground block mt-1">{selectedClient.taxId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Segmento Técnico</span>
                          <span className="text-foreground block mt-1">{selectedClient.segment}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Facturación Consolidada</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450 block mt-1">{formatCop(selectedClient.totalInvoiced)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">País de Operación</span>
                          <span className="text-foreground block mt-1">Colombia</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-accent/25 space-y-3 shadow-xs">
                      <h4 className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Parámetros Operacionales de Planta</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed font-light">
                        Este cliente cuenta con especificaciones de preingeniería registradas desde el wizard. Para verificar el análisis de CFD y la velocidad en ductos, consulte el expediente técnico en el módulo de Requerimientos.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: CONTACTOS MOCK */}
                {activeTab === "contacts" && (
                  <div className="space-y-4">
                    {[
                      { name: "Ing. Clara Restrepo", role: "Directora de Operaciones / HVAC", phone: "+57 312 456 7890", email: "c.restrepo@empresa.com", lead: true },
                      { name: "Mario Pérez", role: "Jefe de Mantenimiento", phone: "+57 300 987 6543", email: "m.perez@empresa.com", lead: false },
                      { name: "Sonia Valencia", role: "Compras / Abastecimiento", phone: "+57 315 222 3344", email: "s.valencia@empresa.com", lead: false }
                    ].map((contact, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-border bg-accent/20 flex items-start justify-between gap-4 shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{contact.name}</span>
                            {contact.lead && <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">Principal</span>}
                          </div>
                          <span className="text-[10px] text-muted-foreground block">{contact.role}</span>
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono pt-1">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-primary" /> {contact.phone}</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-primary" /> {contact.email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: HISTORIAL MOCK */}
                {activeTab === "history" && (
                  <div className="space-y-4 font-mono text-xs">
                    {[
                      { code: "COT-2026-004", desc: "Red Extracción Axial Fundición", amount: 15400000, date: "2026-06-15", status: "Aprobado", icon: FileCheck2 },
                      { code: "OT-9942", desc: "Balanceo Dinámico Turbina Extractor 15HP", amount: 2500000, date: "2026-06-10", status: "Finalizado", icon: Briefcase },
                      { code: "DIA-00892", desc: "Diagnóstico Caudal Naves A-B", amount: 0, date: "2026-06-08", status: "Emitido", icon: ClipboardList }
                    ].map((hist, idx) => {
                      const Icon = hist.icon;
                      return (
                        <div key={idx} className="p-4 rounded-lg border border-border bg-accent/20 flex items-center justify-between gap-4 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-card text-muted-foreground border border-border">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{hist.code}</span>
                                <span className="text-[9px] px-1.5 py-0.2 bg-card text-muted-foreground rounded border border-border">{hist.status}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-sans block mt-0.5">{hist.desc}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-bold text-foreground block">{hist.amount > 0 ? formatCop(hist.amount) : "N/A"}</span>
                            <span className="text-[9px] text-muted-foreground block">{hist.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

              {/* Botón de Cierre de Ficha */}
              <div className="p-6 border-t border-border bg-accent/20 flex justify-end">
                <Button onClick={() => setIsSheetOpen(false)} className="border-border hover:bg-accent text-xs text-foreground cursor-pointer bg-card">
                  Cerrar Panel
                </Button>
              </div>
            </div>
          )}

        </SheetContent>
      </Sheet>
    </div>
  );
}
