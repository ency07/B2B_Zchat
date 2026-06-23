"use client";

import React, { useState } from "react";
import { CatalogCategory } from "@/app/actions/catalog";
import { ChevronRight, X, Gauge, Cog, Thermometer, Ruler, FileText, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SolutionCatalogProps {
  catalog: CatalogCategory[];
  branding: Record<string, any>;
  tenantCode: string;
}

function getUseCase(product: any) {
  const name = product.name?.toLowerCase() || "";
  if (name.includes("hongo") || name.includes("techo")) return { icon: "🏭", useCase: "Extracción cenital", problem: "Calor acumulado en cubierta industrial" };
  if (name.includes("tubo") && name.includes("axial")) return { icon: "🔧", useCase: "Ventilación en ducto", problem: "Gases confinados en túneles o galerías" };
  if (name.includes("axial")) return { icon: "🌬️", useCase: "Extracción mural", problem: "Renovación de aire en nave abierta" };
  if (name.includes("centrífugo") || name.includes("blower")) return { icon: "⚡", useCase: "Alta presión", problem: "Sistemas con ductería compleja y caída de presión" };
  if (name.includes("encajonado")) return { icon: "🔇", useCase: "Ventilación silenciosa", problem: "Restricción acústica en perímetro urbano" };
  return { icon: "⚙️", useCase: "Ventilación industrial", problem: "Requerimiento de ventilación general" };
}

export default function SolutionCatalog({ catalog, branding, tenantCode }: SolutionCatalogProps) {
  const accent = branding.color_primario || "#0ea5e9";
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const products = catalog.flatMap((cat) =>
    cat.subcategories.flatMap((sub) =>
      sub.families.flatMap((fam: any) =>
        fam.series.flatMap((ser: any) =>
          ser.products.map((prod: any) => {
            const specs = prod.specifications || {};
            const nameLower = prod.name?.toLowerCase() || "";
            let cfmMin = 1000, cfmMax = 10000;
            if (nameLower.includes("centrífugo")) { cfmMin = 2500; cfmMax = 20000; }
            else if (nameLower.includes("axial")) { cfmMin = 5000; cfmMax = 25000; }
            else if (nameLower.includes("hongo")) { cfmMin = 1500; cfmMax = 12000; }
            else if (nameLower.includes("encajonado")) { cfmMin = 1200; cfmMax = 12000; }

            return {
              ...prod,
              sku: prod.productCode || `EQ-${prod.id?.slice(0, 6).toUpperCase() || "000000"}`,
              cfmMin,
              cfmMax,
              material: specs["material"] || specs["Material"] || "Acero Estructural",
              potencia: specs["potencia"] || specs["Potencia"] || specs["motor"] || specs["Motor"] || "Consultar",
              caudalVal: `${Math.round(cfmMax * 1.7).toLocaleString("es-CO")} m³/h`,
              categoryName: cat.name || "Industrial",
              ...getUseCase(prod),
            };
          })
        )
      )
    )
  );

  const categories = [...new Set(products.map((p: any) => p.categoryName))];
  const filtered = activeCategory ? products.filter((p: any) => p.categoryName === activeCategory) : products;

  return (
    <section id="catalogo" className="relative bg-zinc-950 py-28 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-16">
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4 block">
            Catálogo técnico
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.05] max-w-4xl mb-6">
            Equipos clasificados por el problema que resuelven
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
            Cada equipo existe para una necesidad específica. Seleccioná tu problema
            y encontrá la solución de ingeniería correspondiente. Sin catálogos genéricos.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
              !activeCategory
                ? "bg-white/5 text-white border-white/15"
                : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            Todos
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                activeCategory === cat
                  ? "bg-white/5 text-white border-white/15"
                  : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid — 3 cols */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 9).map((product: any) => (
            <button
              key={product.id}
              onClick={() => setActiveProduct(product)}
              className="text-left group relative bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700/70 hover:bg-zinc-900/60 transition-all duration-300"
            >
              {/* Use case badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/50 text-[11px] text-zinc-400 mb-4">
                {product.icon} {product.useCase}
              </span>

              {/* Name */}
              <h3 className="text-[15px] font-display font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {product.name}
              </h3>

              {/* Problem solved */}
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                {product.problem}
              </p>

              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Caudal", value: `${product.cfmMin.toLocaleString()}–${product.cfmMax.toLocaleString()} CFM` },
                  { label: "Material", value: product.material },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-zinc-950/50 rounded-lg px-3 py-2">
                    <span className="text-[10px] text-zinc-600 block">{label}</span>
                    <span className="text-xs font-medium text-zinc-300">{value}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                <span className="text-[10px] font-mono text-zinc-700">{product.sku}</span>
                <span className="text-[11px] font-medium flex items-center gap-1 transition-colors group-hover:text-cyan-400" style={{ color: accent }}>
                  Ficha técnica <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* View all CTA */}
        {products.length > 9 && (
          <div className="mt-8 text-center">
            <button className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
              Ver todos los equipos ({products.length}) <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Product detail overlay */}
      {activeProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveProduct(null)}
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 rounded-t-2xl p-6 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/50 text-[11px] text-zinc-400 mb-3">
                  {activeProduct.icon} {activeProduct.useCase}
                </span>
                <h3 className="text-xl font-display font-bold text-white mb-1">{activeProduct.name}</h3>
                <p className="text-sm text-zinc-500">{activeProduct.problem}</p>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Gauge, label: "Caudal", value: `${activeProduct.caudalVal} · ${activeProduct.cfmMin.toLocaleString()}–${activeProduct.cfmMax.toLocaleString()} CFM` },
                  { icon: Cog, label: "Motor", value: activeProduct.potencia },
                  { icon: Ruler, label: "Material", value: activeProduct.material },
                  { icon: Thermometer, label: "Temp. máx.", value: activeProduct.specifications?.tempMax || "80°C" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-zinc-950 border border-zinc-800/30 rounded-xl p-3.5 text-center">
                    <Icon className="w-4 h-4 text-zinc-600 mx-auto mb-2" />
                    <span className="text-[10px] text-zinc-500 block mb-0.5">{label}</span>
                    <span className="text-xs font-semibold text-white leading-tight block">{value}</span>
                  </div>
                ))}
              </div>

              {/* SKU */}
              <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                <span className="font-mono">{activeProduct.sku}</span>
                <span className="text-zinc-800">·</span>
                <span>{activeProduct.categoryName}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-zinc-800/50">
                <Link
                  href="#contacto"
                  onClick={() => setActiveProduct(null)}
                  className="flex-1 text-center py-3 rounded-xl text-[15px] font-semibold text-black transition-all hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  Solicitar información técnica
                </Link>
                <button className="px-5 py-3 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-all flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
