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
import { Search, ChevronLeft, ChevronRight, ArrowRightLeft, Sparkles } from "lucide-react";

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
import { getInventoryStock, createInventoryMovement } from "@/app/actions";

// Zod schema for stock movements
const movementSchema = z.object({
  itemCode: z.string().min(1, { message: "Por favor, selecciona un artículo." }),
  warehouse: z.string().min(1, { message: "Por favor, selecciona la bodega." }),
  type: z.string().min(1, { message: "Por favor, selecciona el tipo de movimiento." }),
  quantity: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "La cantidad debe ser un número entero positivo mayor a 0.",
    }),
  notes: z.string().max(100).optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface StockItem {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  itemCode: string;
  itemName: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  reserved: number;
  available: number;
}

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      itemCode: "",
      warehouse: "",
      type: "",
      quantity: "",
      notes: "",
    },
  });

  const loadStock = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInventoryStock(tenantParam);
      setStock(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    loadStock();
  }, [loadStock]);

  const onSubmit = async (values: MovementFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const formattedType = values.type === "ENTRADA" ? "Entrada" : "Salida";
      await createInventoryMovement(tenantParam, {
        type: formattedType,
        itemCode: values.itemCode,
        quantity: Number(values.quantity),
        notes: values.notes || "",
        sourceWarehouse: values.warehouse,
      });
      setIsSheetOpen(false);
      form.reset();
      await loadStock();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al registrar el movimiento.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get unique list of items and warehouses for the dropdown selection
  const uniqueItems = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { code: string; name: string }[] = [];
    stock.forEach((s) => {
      if (!seen.has(s.itemCode)) {
        seen.add(s.itemCode);
        list.push({ code: s.itemCode, name: s.itemName });
      }
    });
    return list;
  }, [stock]);

  const uniqueWarehouses = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { code: string; name: string }[] = [];
    stock.forEach((s) => {
      if (!seen.has(s.warehouseCode)) {
        seen.add(s.warehouseCode);
        list.push({ code: s.warehouseCode, name: s.warehouseName });
      }
    });
    return list;
  }, [stock]);

  const columns: ColumnDef<StockItem>[] = [
    {
      accessorKey: "warehouseName",
      header: "Bodega",
      cell: ({ row }) => <span className="font-semibold text-xs text-foreground">{row.getValue("warehouseName")}</span>,
    },
    {
      accessorKey: "itemCode",
      header: "Código",
      cell: ({ row }) => <code className="text-[11px] font-mono text-foreground/80">{row.getValue("itemCode")}</code>,
    },
    {
      accessorKey: "itemName",
      header: "Descripción",
      cell: ({ row }) => <div className="max-w-xs md:max-w-md truncate font-semibold text-foreground">{row.getValue("itemName")}</div>,
    },
    {
      accessorKey: "quantity",
      header: () => <div className="text-right">Físico</div>,
      cell: ({ row }) => <div className="text-right font-mono text-foreground">{row.getValue("quantity")} u.</div>,
    },
    {
      accessorKey: "reserved",
      header: () => <div className="text-right text-amber-600 dark:text-amber-450">Reservado</div>,
      cell: ({ row }) => <div className="text-right font-mono text-amber-600 dark:text-amber-450">{row.getValue("reserved")} u.</div>,
    },
    {
      accessorKey: "available",
      header: () => <div className="text-right">Disponible</div>,
      cell: ({ row }) => {
        const available = Number(row.getValue("available"));
        const isLow = available < 10;
        return (
          <div className="text-right font-mono font-semibold text-foreground">
            {available} u.
            {isLow && (
              <Badge variant="warning" className="ml-2 text-[8px] py-0 px-1 font-mono uppercase">STOCK BAJO</Badge>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: stock,
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
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Almacenes
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Control de Inventario
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitoreo de existencias de materiales, control de reservas y registro de movimientos de stock.
          </p>
        </div>

        {/* Sheet Slide-out */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <ArrowRightLeft className="w-4 h-4" /> Registrar Movimiento
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md backdrop-blur-md">
            <div className="p-8 space-y-6 bg-card">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Bodega / Stock</span>
                <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Registrar Transacción</h3>
                <p className="text-xs text-muted-foreground">Ingresa una entrada o salida física de inventario para una bodega.</p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                  {/* Item Selection */}
                  <FormField
                    control={form.control}
                    name="itemCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Artículo / Insumo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary shadow-inner">
                              <SelectValue placeholder="Selecciona el artículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {uniqueItems.map((item) => (
                              <SelectItem key={item.code} value={item.code}>
                                {item.code} - {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Warehouse */}
                  <FormField
                    control={form.control}
                    name="warehouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Bodega Destino</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary shadow-inner">
                              <SelectValue placeholder="Selecciona la bodega" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {uniqueWarehouses.map((wh) => (
                              <SelectItem key={wh.code} value={wh.code}>
                                {wh.name} ({wh.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Movement Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Tipo de Movimiento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary shadow-inner">
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="ENTRADA">Entrada / Recepción</SelectItem>
                            <SelectItem value="SALIDA">Salida / Consumo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Cantidad Transaccionada</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej. 10" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Comentarios / Referencia</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. OT-2026-001 o factura N°102" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                      {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                      Aplicar Movimiento
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filter and table */}
      <div className="space-y-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por artículo..."
            value={(table.getColumn("itemName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("itemName")?.setFilterValue(event.target.value)}
            className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 border border-border rounded-lg bg-card/30">
            <Spinner size="lg" className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando existencias...</span>
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
                      <TableRow key={row.id} className="hover:bg-accent/30 cursor-pointer border-b border-border/40 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2 px-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                        // No se encontraron artículos en stock.
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
    </div>
  );
}
