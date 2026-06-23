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
  Calendar,
  User,
  FileText,
  CreditCard,
  AlertCircle,
  Receipt
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
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
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
import { getInvoices, createInvoice, getClients } from "@/app/actions";

// Zod schema for invoice creation
const invoiceSchema = z.object({
  clientName: z.string().min(1, { message: "Por favor, selecciona un cliente." }),
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "El importe total debe ser un número positivo mayor a 0.",
    }),
  description: z.string().min(5, { message: "Por favor, ingresa los conceptos de facturación." }),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface ClientOption {
  id: string;
  name: string;
}

// Utility currency formatter for COP/USD
const formatCurrency = (amount: number) => {
  if (amount < 100000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<ClientOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sheet States
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<"create" | "detail">("create");
  const [selectedInvoice, setSelectedInvoice] = React.useState<any | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: "",
      amount: "",
      description: "",
    },
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const invoicesData = await getInvoices(tenantParam);
      const clientsData = await getClients(tenantParam);
      
      setInvoices(invoicesData);
      setClients(clientsData.map(c => ({ id: c.id, name: c.name })));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (values: InvoiceFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createInvoice(tenantParam, {
        clientName: values.clientName,
        concept: values.description,
        amount: Number(values.amount)
      });
      setIsSheetOpen(false);
      form.reset();
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al emitir la factura.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (invoice: any) => {
    setSelectedInvoice(invoice);
    setSheetMode("detail");
    setIsSheetOpen(true);
  };

  const handleOpenCreate = () => {
    setSheetMode("create");
    setIsSheetOpen(true);
  };

  // Helper to generate mock payment timeline
  const getPaymentsTimeline = (invoice: any) => {
    if (!invoice) return [];
    const total = invoice.totalAmount;
    const paid = invoice.paidAmount;
    const dateStr = invoice.date || "2026-06-19";

    if (invoice.status === "PAGADA") {
      return [
        {
          id: "PAY-9812",
          date: dateStr,
          amount: total,
          method: "Transferencia Bancaria Bancolombia",
          status: "APROBADO",
          ref: "TRN-9817293"
        }
      ];
    }

    if (invoice.status === "PARCIALMENTE_PAGADA") {
      return [
        {
          id: "PAY-7412",
          date: dateStr,
          amount: paid,
          method: "PSE / Débito Inmediato",
          status: "APROBADO",
          ref: "TRN-1092873"
        }
      ];
    }

    return [];
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Folio Factura",
      cell: ({ row }) => (
        <button
          onClick={() => handleOpenDetail(row.original)}
          className="text-left font-mono font-semibold text-xs text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
        >
          {row.getValue("code")}
        </button>
      ),
    },
    {
      accessorKey: "clientName",
      header: "Cliente B2B",
      cell: ({ row }) => <div className="font-semibold text-foreground text-xs">{row.getValue("clientName")}</div>,
    },
    {
      accessorKey: "date",
      header: "Fecha Emisión",
      cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{row.getValue("date")}</span>,
    },
    {
      accessorKey: "totalAmount",
      header: () => <div className="text-right font-semibold">Monto Total</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalAmount"));
        return <div className="text-right font-mono font-semibold text-foreground">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "paidAmount",
      header: () => <div className="text-right font-semibold text-emerald-500">Cobrado</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("paidAmount") || "0");
        return <div className="text-right font-mono font-medium text-emerald-600 dark:text-emerald-450">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Estado de Pago",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "success" | "warning" | "destructive" | "secondary" = "secondary";
        if (status === "PAGADA") variant = "success";
        if (status === "PARCIALMENTE_PAGADA" || status === "PARCIAL") variant = "warning";
        if (status === "PENDIENTE" || status === "EMITIDA") variant = "destructive";
        
        let label = status;
        if (status === "EMITIDA") label = "PENDIENTE";
        if (status === "PARCIALMENTE_PAGADA") label = "PARCIAL";

        return <Badge variant={variant} className="text-[9px] font-mono font-bold py-0 px-1.5 uppercase">{label}</Badge>;
      },
    },
  ];

  const table = useReactTable({
    data: invoices,
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
        pageSize: 10,
      },
    },
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Finanzas
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Facturas y Cobranza B2B
          </h1>
          <p className="text-xs text-muted-foreground">
            Administración de cuentas por cobrar, estados de pago de cuentas industriales y registro de abonos.
          </p>
        </div>

        {/* Action Button using Sheet */}
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Emitir Factura
        </Button>
      </div>

      {/* Filter and table */}
      <div className="space-y-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={(table.getColumn("clientName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("clientName")?.setFilterValue(event.target.value)}
            className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
            <Spinner size="lg" className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando facturas...</span>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card/45 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
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
                        className="cursor-pointer transition-colors border-b border-border/40 hover:bg-accent/30"
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
                      <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest py-8">
                        // No se encontraron facturas emitidas.
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
          </>
        )}
      </div>

      {/* Slide-out Sheet Panel for Creation / Detailed Drill-down */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-xl backdrop-blur-md">
          
          {/* MODO CREACIÓN */}
          {sheetMode === "create" && (
            <div className="p-8 space-y-6 bg-card">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Nueva Factura</span>
                <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Emitir Factura Comercial</h3>
                <p className="text-xs text-muted-foreground">Ingresa los conceptos e importe total para generar el registro de venta.</p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Client Selection */}
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Cliente B2B</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary shadow-inner">
                              <SelectValue placeholder="Selecciona el cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Amount */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Monto Total Facturado (COP / USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej. 75000000 o 18500" {...field} className="bg-background border-border text-foreground text-xs font-mono shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormDescription className="text-[10px] text-muted-foreground">
                          Si es menor a 100,000 se asume USD. Mayor o igual se asume COP.
                        </FormDescription>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Conceptos de Facturación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Fabricación de Turbomáquina de Extracción Ax-7500" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormDescription className="text-[10px] text-muted-foreground">
                          Desglose breve del servicio o materiales vendidos.
                        </FormDescription>
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
                      Emitir Factura
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* MODO DETALLE */}
          {sheetMode === "detail" && selectedInvoice && (() => {
            const total = selectedInvoice.totalAmount;
            const paid = selectedInvoice.paidAmount;
            const balance = total - paid;
            const timeline = getPaymentsTimeline(selectedInvoice);

            return (
              <div className="flex flex-col h-full bg-card">
                {/* Header Ficha */}
                <div className="p-8 border-b border-border bg-accent/25 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold">// Consulta de Factura</span>
                      <h2 className="text-base font-bold text-foreground tracking-tight mt-0.5 font-mono">{selectedInvoice.code}</h2>
                    </div>
                    <Badge variant={selectedInvoice.status === "PAGADA" ? "success" : selectedInvoice.status === "PARCIALMENTE_PAGADA" || selectedInvoice.status === "PARCIAL" ? "warning" : "destructive"} className="text-[9px] font-mono py-0.5 px-2 uppercase">
                      {selectedInvoice.status === "EMITIDA" ? "PENDIENTE" : selectedInvoice.status === "PARCIALMENTE_PAGADA" ? "PARCIAL" : selectedInvoice.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1.5 font-mono text-[9px] uppercase"><User className="w-3.5 h-3.5 text-primary" /> Cliente B2B</span>
                      <div className="font-semibold text-foreground">{selectedInvoice.clientName}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1.5 font-mono text-[9px] uppercase"><Calendar className="w-3.5 h-3.5 text-primary" /> Emisión</span>
                      <div className="font-mono text-foreground">{selectedInvoice.date}</div>
                    </div>
                  </div>
                </div>

                {/* Body Ficha */}
                <div className="p-8 flex-1 space-y-6 overflow-y-auto">
                  
                  {/* Financial Summary */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Receipt className="w-3.5 h-3.5 text-primary" /> // Resumen de Saldos
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-accent/20 border border-border p-3 rounded-lg space-y-1 shadow-xs">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">Monto Total</span>
                        <div className="text-xs font-mono font-bold text-foreground">{formatCurrency(total)}</div>
                      </div>
                      <div className="bg-accent/20 border border-border p-3 rounded-lg space-y-1 shadow-xs">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">Abonos</span>
                        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(paid)}</div>
                      </div>
                      <div className="bg-accent/20 border border-border p-3 rounded-lg space-y-1 shadow-xs">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">Saldo Restante</span>
                        <div className={`text-xs font-mono font-bold ${balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {formatCurrency(balance)}
                        </div>
                      </div>
                    </div>

                    {balance > 0 && (
                      <div className="flex items-start gap-2 p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs font-mono">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          // Esta factura registra un saldo pendiente de cobro de <span className="font-bold">{formatCurrency(balance)}</span>.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-primary" /> // Historial de Abonos y Cobranza
                    </h4>

                    {timeline.length > 0 ? (
                      <div className="relative border-l border-border ml-2.5 pl-5 space-y-4 font-mono text-xs">
                        {timeline.map((pay: any) => (
                          <div key={pay.id} className="relative space-y-1">
                            {/* Dot indicator */}
                            <div className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-emerald-500 border border-card flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-semibold text-foreground">{pay.id} — {pay.method}</span>
                              <Badge variant="success" className="text-[9px] font-mono font-bold py-0 px-1 uppercase">{pay.status}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                              <span>Ref: {pay.ref}</span>
                              <span>Fecha: {pay.date}</span>
                            </div>
                            <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-450 pt-0.5">
                              + {formatCurrency(pay.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-border bg-accent/20 rounded-xl p-6 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                        // No se registran transacciones de pago/abonos para esta factura.
                      </div>
                    )}
                  </div>

                  {/* PDF Download Mock Action */}
                  <div className="pt-4 border-t border-border">
                    <Button 
                      onClick={() => alert("Generando descarga de PDF CFDI / Factura...")}
                      className="w-full bg-card border border-border text-foreground hover:bg-accent text-xs h-9 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-primary" /> Descargar Factura (PDF / XML)
                    </Button>
                  </div>

                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
