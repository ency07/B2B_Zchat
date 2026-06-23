"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  TrendingUp,
  FileCheck,
  Layers,
  ShoppingBag
} from "lucide-react";
import { useLayout } from "./layout-context";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/leads", label: "Pipeline Leads", icon: TrendingUp },
  { href: "/dashboard/requirements", label: "Requerimientos", icon: ClipboardList },
  { href: "/dashboard/quotes", label: "Cotizaciones", icon: FileCheck },
  { href: "/dashboard/jobs", label: "Trabajos OTs", icon: Briefcase },
  { href: "/dashboard/inventory", label: "Inventario", icon: Package },
  { href: "/dashboard/purchases", label: "Compras", icon: ShoppingBag },
  { href: "/dashboard/invoices", label: "Facturas", icon: FileText },
  { href: "/dashboard/cms", label: "CMS Admin", icon: Layers },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useLayout();

  const [logoUrl, setLogoUrl] = React.useState<string>("");
  const [companyName, setCompanyName] = React.useState<string>("VentiTech OS");

  React.useEffect(() => {
    const loadCachedBranding = () => {
      const cacheKey = `tenant_config_${tenantParam || "default"}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const config = JSON.parse(cached);
          const isDark = document.documentElement.classList.contains("dark");
          const logo = isDark 
            ? (config.logo_oscuro_url || config.logo_claro_url) 
            : (config.logo_claro_url || config.logo_oscuro_url);
          setLogoUrl(logo || "");
          setCompanyName(config.nombre_comercial || (tenantParam === "apex" ? "Apex Logística" : "VentiTech"));
        } catch (e) {}
      } else {
        setCompanyName(tenantParam === "apex" ? "Apex Logística" : "VentiTech");
      }
    };

    loadCachedBranding();
    
    // Sync logo if theme changes or storage changes
    const interval = setInterval(loadCachedBranding, 2000);
    return () => clearInterval(interval);
  }, [tenantParam]);

  // Desktop sidebar rendering
  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  return (
    <>
      {/* MOBILE DRAWER BACKDROP */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-card/95 backdrop-blur-md border-r border-border shadow-2xl lg:hidden"
          >
            {/* Header Mobile */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-8 max-w-[180px] object-contain" />
              ) : (
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-foreground">
                  {companyName}
                </span>
              )}
              <button
                onClick={closeMobile}
                className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links Mobile */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 border rounded-md transition-all duration-150 text-[10px] tracking-widest font-mono uppercase",
                      isActive
                        ? "bg-accent text-foreground border-border font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-[25%] bottom-[25%] w-[3px] bg-primary rounded-r" />
                    )}
                    <Icon className={cn("w-4 h-4 shrink-0 stroke-[1.5]", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 bg-card/90 backdrop-blur-md border-r border-border shrink-0 transition-all duration-300 z-30 shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.02)]",
          sidebarWidth
        )}
      >
        {/* Header Desktop */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
          {!isCollapsed ? (
            logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-8 max-w-[150px] object-contain" />
            ) : (
              <span className="font-mono text-xs uppercase tracking-widest font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {companyName}
              </span>
            )
          ) : (
            <span className="font-mono text-xs uppercase tracking-widest font-bold text-primary mx-auto">
              {companyName.substring(0, 2).toUpperCase()}
            </span>
          )}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              aria-label="Colapsar menú"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Toggle Button when closed */}
        {isCollapsed && (
          <div className="flex justify-center py-2 border-b border-border shrink-0">
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Expandir menú"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Links Desktop */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center transition-all duration-150 border",
                  isCollapsed ? "justify-center p-3 rounded-md" : "gap-3 px-3 py-2.5 rounded-md text-[10px] tracking-widest font-mono uppercase",
                  isActive
                    ? "bg-accent text-foreground border-border font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.08)]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-[25%] bottom-[25%] w-[3px] bg-primary rounded-r" />
                )}
                <Icon className={cn("shrink-0 stroke-[1.5]", isCollapsed ? "w-5 h-5" : "w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
