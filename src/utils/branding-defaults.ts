export interface BrandingConfig {
  // SUBSECCIÓN A: Información de Empresa
  nombre_comercial: string;
  razon_social: string;
  nit: string;
  direccion: string;
  ciudad: string;
  pais: string;
  telefono_principal: string;
  email_corporativo: string;
  web: string;

  // Localizacion
  zona_horaria: string;
  idioma: string;
  moneda: string;
  formato_fecha: string;
  formato_hora: string;
  separador_decimal: string;
  separador_miles: string;

  // SUBSECCIÓN B: Logos y recursos visuales
  logo_claro_url: string;
  logo_oscuro_url: string;
  logo_login_url: string;
  logo_pdf_url: string;
  favicon_url: string;
  splash_url: string;
  loader_url: string;
  icono_movil_url: string;
  whatsapp: string;

  // SUBSECCIÓN C: Colores
  color_primario: string;
  color_secundario: string;
  color_exito: string;
  color_warning: string;
  color_danger: string;
  color_info: string;

  // SUBSECCIÓN D: Tipografía
  tipografia_principal: string;
  border_radius: string;
  sombras: string;
  animaciones: string;

  // Documentos
  firma_url: string;
  sello_url: string;

  // NUEVAS VARIABLES DE PERSONALIZACIÓN INTEGRAL (FASE 34)
  nombre_erp: string;
  nombre_portal_cliente: string;
  titulo_navegador: string;
  landing_video_url: string;
  landing_titulo: string;
  landing_subtitulo: string;
  dossier_url: string;
  plantilla_correo_asunto: string;
  plantilla_correo_cuerpo: string;
  plantilla_pdf_encabezado: string;
  plantilla_pdf_pie: string;
}

// Default settings per tenant code
export function getBrandingDefaults(tenantCode?: string | null): BrandingConfig {
  const isApex = tenantCode?.toLowerCase() === "apex";
  
  return {
    // Subsection A
    nombre_comercial: isApex ? "Apex Logística B2B" : "VentiTech",
    razon_social: isApex ? "Apex Logistics B2B Group S.A. de C.V." : "VentiTech S.A.S.",
    nit: isApex ? "APX150508LL2" : "901.201.764-3",
    direccion: isApex ? "Km 12 Vía Aeropuerto Bodega 4" : "Calle 26 # 69D-91, Of. 402",
    ciudad: isApex ? "Bogotá" : "Bogotá",
    pais: isApex ? "Colombia" : "Colombia",
    telefono_principal: isApex ? "+57 601 765 4321" : "+57 300 123 4567",
    email_corporativo: isApex ? "info@apexlogistics.com" : "contacto@ventitech.co",
    web: isApex ? "https://apexlogistics.com" : "https://ventitech.co",
    zona_horaria: "America/Bogota",
    idioma: "es",
    moneda: "COP",
    formato_fecha: "DD/MM/YYYY",
    formato_hora: "HH:mm",
    separador_decimal: ",",
    separador_miles: ".",

    // Subsection B
    logo_claro_url: "",
    logo_oscuro_url: "",
    logo_login_url: "",
    logo_pdf_url: "",
    favicon_url: "",
    splash_url: "",
    loader_url: "",
    icono_movil_url: "",
    whatsapp: "",

    // Subsection C
    color_primario: isApex ? "#2563EB" : "#0284c7", // Apex is blue, VentiTech is sky blue
    color_secundario: isApex ? "#0F172A" : "#111827",
    color_exito: "#10B981",
    color_warning: "#F59E0B",
    color_danger: "#EF4444",
    color_info: "#3B82F6",

    // Subsection D
    tipografia_principal: "Inter",
    border_radius: "8px",
    sombras: "sutil",
    animaciones: "activadas",

    // Documentos
    firma_url: "",
    sello_url: "",

    // Nuevas configuraciones con defaults
    nombre_erp: isApex ? "Apex ERP" : "Portal ERP Administrador",
    nombre_portal_cliente: isApex ? "Apex Portal Cliente" : "Portal Cliente",
    titulo_navegador: isApex ? "Apex B2B Logistics" : "Sistemas de Ventilación Industrial",
    landing_video_url: "/video_hero.mp4",
    landing_titulo: "ESPECIALISTAS EN VENTILACIÓN INDUSTRIAL",
    landing_subtitulo: "Diseño, venta, instalación, mantenimiento y modernización de sistemas de inyección y extracción de aire controlado",
    dossier_url: "",
    plantilla_correo_asunto: "[{{nombre_comercial}}] Confirmación de solicitud de servicio",
    plantilla_correo_cuerpo: "Estimado cliente,\n\nHemos recibido su solicitud técnica. Un ingeniero especializado le contactará a la brevedad.\n\nAtentamente,\nEl equipo de Ingeniería.",
    plantilla_pdf_encabezado: "DISEÑO Y MONTAJE DE SISTEMAS DE EXTRACCIÓN INDUSTRIAL",
    plantilla_pdf_pie: "Soporte de Ingeniería B2B Premium | Certificaciones AMCA / ASHRAE / RETIE"
  };
}
