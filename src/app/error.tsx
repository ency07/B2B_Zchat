"use client";

/**
 * LANDING-ST02 — Error State para la Landing Page
 * Next.js App Router usa este Client Component como Error Boundary
 * cuando page.tsx lanza una excepción (ej: fallo en carga del catálogo).
 */
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Wifi } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log al servicio de monitoreo (Sentry, Datadog, etc.)
    console.error("[Landing] Error crítico en carga de página:", error);
  }, [error]);

  return (
    <main className="flex flex-col min-h-screen bg-zinc-950 text-white items-center justify-center p-6">
      {/* Card de error */}
      <div className="max-w-md w-full text-center space-y-8 p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm">
        {/* Icono */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        {/* Texto */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white">
            Error al cargar el catálogo
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            No fue posible conectar con el servidor de productos. Verifique su
            conexión a internet e intente de nuevo.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-600 font-mono bg-zinc-900 rounded px-3 py-1.5 inline-block">
              Código: {error.digest}
            </p>
          )}
        </div>

        {/* Hint de conectividad */}
        <div className="flex items-center gap-2 justify-center text-xs text-zinc-500">
          <Wifi className="w-3.5 h-3.5" />
          <span>Verifique su conexión antes de reintentar</span>
        </div>

        {/* CTA */}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white rounded-lg font-semibold transition-all duration-150"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>

        {/* Contacto de soporte */}
        <p className="text-xs text-zinc-600">
          Si el problema persiste,{" "}
          <a
            href="mailto:soporte@ventitech.co"
            className="text-zinc-400 hover:text-zinc-200 underline transition-colors"
          >
            contacte soporte técnico
          </a>
        </p>
      </div>
    </main>
  );
}
