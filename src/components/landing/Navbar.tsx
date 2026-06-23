"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";

interface NavbarProps {
  branding: Record<string, any>;
}

export default function Navbar({ branding }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const siteName = branding.nombre_comercial || "AeroMax Industrial";
  const logoUrl = branding.logo_claro_url;
  const accent = branding.color_primario || "#0ea5e9";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#soluciones", label: "Soluciones" },
    { href: "#diagnostico", label: "Diagnóstico" },
    { href: "#catalogo", label: "Catálogo" },
    { href: "#contacto", label: "Contacto" },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-zinc-950/85 backdrop-blur-2xl border-b border-zinc-800/40 shadow-2xl shadow-black/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-7 lg:h-8 w-auto" />
            ) : (
              <span
                className="text-lg font-display font-bold tracking-tight"
                style={{ color: accent }}
              >
                {siteName}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-10">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:+57"
              className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              +57 300 000 0000
            </a>
            <a
              href="#contacto"
              className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-black transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: accent }}
            >
              Solicitar diagnóstico
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-96 border-t border-zinc-800/40" : "max-h-0"
        }`}
      >
        <div className="bg-zinc-950/95 backdrop-blur-2xl px-4 py-5 space-y-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-zinc-400 hover:text-white py-1.5 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contacto"
            onClick={() => setMobileOpen(false)}
            className="block text-center px-5 py-3 rounded-lg text-[13px] font-semibold text-black mt-3 transition-all"
            style={{ backgroundColor: accent }}
          >
            Solicitar diagnóstico
          </a>
        </div>
      </div>
    </nav>
  );
}
