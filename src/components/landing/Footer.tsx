interface FooterProps {
  branding: Record<string, any>;
}

export default function Footer({ branding }: FooterProps) {
  const siteName = branding.nombre_comercial || "AeroMax Industrial";
  const accent = branding.color_primario || "#0ea5e9";

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4
              className="text-base font-display font-bold mb-3"
              style={{ color: accent }}
            >
              {siteName}
            </h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Ingeniería de ventilación industrial. Diseñamos, fabricamos y mantenemos
              sistemas de extracción e inyección de aire para plantas que no pueden parar.
            </p>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Soluciones
            </h4>
            <ul className="space-y-2.5">
              {[
                "Extracción de calor industrial",
                "Captación de contaminantes",
                "Control de humedad",
                "Atenuación acústica",
                "Ventilación forzada",
                "Mantenimiento predictivo",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#soluciones"
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sectors */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Industrias
            </h4>
            <ul className="space-y-2.5">
              {[
                "Siderurgia y fundición",
                "Cemento y minería",
                "Alimentos y bebidas",
                "Data centers",
                "Automotriz",
                "Farmacéutica",
              ].map((item) => (
                <li key={item} className="text-sm text-zinc-500">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              {[
                "Sobre nosotros",
                "Política de privacidad",
                "Términos de servicio",
                "Garantía de equipos",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/40 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-zinc-700">
            Diseñado para ingenieros, por ingenieros.
          </p>
        </div>
      </div>
    </footer>
  );
}
